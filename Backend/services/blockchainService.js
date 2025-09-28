/**
 * Servicio Blockchain para interactuar con contratos inteligentes
 * 
 * Este servicio maneja:
 * 1. Conexión a Polygon Mumbai Testnet
 * 2. Interacción con contratos de registro y verificación
 * 3. Transacciones de registro de usuarios
 * 4. Verificación de pruebas ZK en blockchain
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.registerContract = null;
    this.verifierContract = null;
    this.isConnected = false;

    // Configuración de red
    this.networks = {
      amoy: {
        chainId: 80002,
        name: 'Polygon Amoy Testnet',
        rpc: process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
        explorer: 'https://amoy.polygonscan.com'
      },
      mumbai: {
        chainId: 80001,
        name: 'Polygon Mumbai Testnet (Deprecated)',
        rpc: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.matic.today',
        explorer: 'https://mumbai.polygonscan.com'
      },
      polygon: {
        chainId: 137,
        name: 'Polygon Mainnet',
        rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        explorer: 'https://polygonscan.com'
      }
    };

    // Direcciones de contratos (se configuran en .env)
    this.contractAddresses = {
      register: process.env.REGISTER_CONTRACT_ADDRESS,
      verifier: process.env.VERIFIER_CONTRACT_ADDRESS
    };
  }

  /**
   * Inicializar el servicio blockchain
   */
  async initialize() {
    try {
      console.log('Inicializando servicio blockchain...');

      // Configurar provider
      await this.setupProvider();

      // Configurar wallet (solo para transacciones del servidor)
      await this.setupWallet();

      // Cargar contratos
      await this.loadContracts();

      this.isConnected = true;
      console.log('Servicio blockchain inicializado');

    } catch (error) {
      console.error('Error inicializando blockchain service:', error);
      // No lanzamos error para permitir que el servidor funcione en modo mock
      console.warn('Funcionando en modo mock sin conexión blockchain');
    }
  }

  /**
   * Configurar provider de blockchain
   */
  async setupProvider() {
    const networkName = process.env.NETWORK_NAME || 'amoy';
    const network = this.networks[networkName];

    if (!network) {
      throw new Error(`Red no soportada: ${networkName}`);
    }

    try {
      this.provider = new ethers.providers.JsonRpcProvider(network.rpc);
      
      // Verificar conexión
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`Conectado a ${network.name}, bloque: ${blockNumber}`);

    } catch (error) {
      console.error('Error conectando a RPC:', error);
      throw new Error(`No se pudo conectar a ${network.name}`);
    }
  }

  /**
   * Configurar wallet para transacciones del servidor
   * NOTA: En producción, usar un wallet dedicado con fondos limitados
   */
  async setupWallet() {
    const privateKey = process.env.SERVER_PRIVATE_KEY;

    if (!privateKey) {
      console.warn('SERVER_PRIVATE_KEY no configurada. Las transacciones del servidor no estarán disponibles.');
      return;
    }

    try {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const address = await this.wallet.getAddress();
      const balance = await this.provider.getBalance(address);
      
      console.log(`Wallet del servidor: ${address}`);
      console.log(`Balance: ${ethers.utils.formatEther(balance)} MATIC`);

      if (balance.lt(ethers.utils.parseEther('0.01'))) {
        console.warn('Balance bajo en wallet del servidor');
      }

    } catch (error) {
      console.error('Error configurando wallet del servidor:', error);
      throw error;
    }
  }

  /**
   * Cargar contratos inteligentes
   */
  async loadContracts() {
    try {
      // Cargar ABIs de contratos
      const registerABI = await this.loadContractABI('register');
      const verifierABI = await this.loadContractABI('verifier');

      // Crear instancias de contratos
      if (this.contractAddresses.register && registerABI) {
        this.registerContract = new ethers.Contract(
          this.contractAddresses.register,
          registerABI,
          this.wallet || this.provider
        );
        console.log('Contrato de registro cargado');
      }

      if (this.contractAddresses.verifier && verifierABI) {
        this.verifierContract = new ethers.Contract(
          this.contractAddresses.verifier,
          verifierABI,
          this.wallet || this.provider
        );
        console.log('Contrato verificador cargado');
      }

      if (!this.registerContract || !this.verifierContract) {
        console.warn(' Algunos contratos no se pudieron cargar. Usando mocks.');
      }

    } catch (error) {
      console.error('Error cargando contratos:', error);
      console.warn(' Usando contratos mock para desarrollo');
    }
  }

  /**
   * Cargar ABI de contrato desde archivo
   */
  async loadContractABI(contractName) {
    try {
      const abiPath = path.join(__dirname, `../../contracts/abi/${contractName}.json`);
      
      if (fs.existsSync(abiPath)) {
        const abiData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        return abiData.abi || abiData; // Manejar diferentes formatos
      } else {
        console.warn(`⚠️  ABI no encontrada para ${contractName}: ${abiPath}`);
        return this.getMockABI(contractName);
      }
    } catch (error) {
      console.error(`Error cargando ABI para ${contractName}:`, error);
      return this.getMockABI(contractName);
    }
  }

  /**
   * Verificar si un usuario está registrado
   */
  async isUserRegistered(userAddress) {
    try {
      if (!this.registerContract) {
        console.warn('Contrato de registro no disponible, usando mock');
        return this.mockIsUserRegistered(userAddress);
      }

      const isRegistered = await this.registerContract.isUserRegistered(userAddress);
      return isRegistered;

    } catch (error) {
      console.error('Error verificando registro de usuario:', error);
      return this.mockIsUserRegistered(userAddress);
    }
  }

  /**
   * Registrar usuario en blockchain
   */
  async registerUser(userAddress, publicSignals, chainId = 80001) {
    try {
      if (!this.registerContract || !this.wallet) {
        console.warn(' Contrato/wallet no disponible, usando mock');
        return this.mockRegisterUser(userAddress, publicSignals);
      }

      // Preparar datos para el contrato
      const hashCommitment = publicSignals[0]; // Primera señal pública como commitment
      
      // Estimar gas
      const gasEstimate = await this.registerContract.estimateGas.registerUser(
        userAddress,
        hashCommitment
      );

      // Enviar transacción
      const tx = await this.registerContract.registerUser(
        userAddress,
        hashCommitment,
        {
          gasLimit: gasEstimate.mul(120).div(100), // +20% buffer
          gasPrice: ethers.utils.parseUnits('30', 'gwei') // Gas price para Mumbai
        }
      );

      console.log(` Transacción de registro enviada: ${tx.hash}`);

      // Esperar confirmación
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };

    } catch (error) {
      console.error('Error registrando usuario:', error);
      return this.mockRegisterUser(userAddress, publicSignals);
    }
  }

  /**
   * Verificar prueba ZK en blockchain
   */
  async verifyProof(userAddress, proof, publicSignals, chainId = 80001) {
    try {
      if (!this.verifierContract) {
        console.warn('  Contrato verificador no disponible, usando mock');
        return this.mockVerifyProof(userAddress, proof, publicSignals);
      }

      // Formatear prueba para el contrato
      const formattedProof = this.formatProofForContract(proof);

      // Llamar función de verificación
      const isValid = await this.verifierContract.verifyProof(
        formattedProof.a,
        formattedProof.b,
        formattedProof.c,
        publicSignals
      );

      // Si es válida, registrar verificación (opcional)
      let transactionHash = null;
      if (isValid && this.wallet) {
        try {
          const tx = await this.verifierContract.recordVerification(
            userAddress,
            publicSignals[0] // Hash commitment
          );
          await tx.wait();
          transactionHash = tx.hash;
        } catch (recordError) {
          console.warn('Error registrando verificación:', recordError);
        }
      }

      return {
        success: true,
        isValid,
        transactionHash,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error verificando prueba en blockchain:', error);
      return this.mockVerifyProof(userAddress, proof, publicSignals);
    }
  }

  /**
   * Formatear prueba para contrato inteligente
   */
  formatProofForContract(proof) {
    return {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
      c: [proof.pi_c[0], proof.pi_c[1]]
    };
  }

  /**
   * Obtener información de contratos (para debug)
   */
  async getContractInfo() {
    return {
      isConnected: this.isConnected,
      network: process.env.NETWORK_NAME || 'mumbai',
      provider: !!this.provider,
      wallet: !!this.wallet,
      contracts: {
        register: {
          address: this.contractAddresses.register,
          loaded: !!this.registerContract
        },
        verifier: {
          address: this.contractAddresses.verifier,
          loaded: !!this.verifierContract
        }
      },
      walletInfo: this.wallet ? {
        address: this.wallet.address,
        hasBalance: true // Se verificaría el balance real
      } : null
    };
  }

  /**
   * MÉTODOS MOCK PARA DESARROLLO
   */

  mockIsUserRegistered(userAddress) {
    // Simular que algunos usuarios están registrados
    const registeredUsers = [
      '0x742d35Cc8e90e3b6E4dB8a5f4e7a2c4d8f9E1234', // Ejemplo
    ];
    
    const isRegistered = registeredUsers.includes(userAddress);
    console.log(` MOCK: Usuario ${userAddress} ${isRegistered ? 'está' : 'no está'} registrado`);
    return isRegistered;
  }

  mockRegisterUser(userAddress, publicSignals) {
    console.log(' MOCK: Registrando usuario', userAddress);
    
    return {
      success: true,
      transactionHash: '0x' + Math.random().toString(16).substring(2),
      blockNumber: Math.floor(Math.random() * 1000000),
      gasUsed: '21000',
      isMock: true,
      warning: 'Esta es una transacción MOCK para desarrollo'
    };
  }

  mockVerifyProof(userAddress, proof, publicSignals) {
    console.log('MOCK: Verificando prueba para', userAddress);
    
    // Simular verificación básica
    const isValid = !!(proof && publicSignals && publicSignals.length > 0);
    
    return {
      success: true,
      isValid,
      transactionHash: isValid ? '0x' + Math.random().toString(16).substring(2) : null,
      isMock: true,
      warning: 'Esta es una verificación MOCK para desarrollo'
    };
  }

  /**
   * ABIs mock para desarrollo
   */
  getMockABI(contractName) {
    const mockABIs = {
      register: [
        "function registerUser(address user, uint256 hashCommitment) external",
        "function isUserRegistered(address user) external view returns (bool)",
        "event UserRegistered(address indexed user, uint256 hashCommitment)"
      ],
      verifier: [
        "function verifyProof(uint[2] memory _pA, uint[2][2] memory _pB, uint[2] memory _pC, uint[] memory _pubSignals) public view returns (bool)",
        "function recordVerification(address user, uint256 hashCommitment) external",
        "event ProofVerified(address indexed user, bool isValid)"
      ]
    };

    return mockABIs[contractName] || [];
  }

  /**
   * Verificar si el servicio está conectado
   */
  isConnected() {
    return this.isConnected;
  }
}

module.exports = BlockchainService;