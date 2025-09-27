import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.web3Modal = null;
    this.isConnected = false;

    this.initWeb3Modal();
  }

  // Inicializar Web3Modal con diferentes proveedores
  initWeb3Modal() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID || "YOUR_INFURA_ID",
          rpc: {
            1: "https://mainnet.infura.io/v3/YOUR_INFURA_ID",
            137: "https://polygon-rpc.com",
            80001: "https://rpc-mumbai.matic.today"
          }
        }
      }
    };

    this.web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions,
      disableInjectedProvider: false,
    });
  }

  // Conectar wallet
  async connectWallet() {
    try {
      // Limpiar cache si existe
      if (this.web3Modal.cachedProvider) {
        await this.web3Modal.clearCachedProvider();
      }

      const instance = await this.web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      this.provider = provider;
      this.signer = signer;
      this.address = address;
      this.chainId = network.chainId;
      this.isConnected = true;

      // Configurar listeners para cambios
      this.setupEventListeners(instance);

      return {
        success: true,
        address,
        chainId: network.chainId,
        networkName: network.name
      };

    } catch (error) {
      console.error('Error conectando wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Conectar solo MetaMask
  async connectMetaMask() {
    try {
      const provider = await detectEthereumProvider();

      if (!provider) {
        throw new Error('MetaMask no está instalado');
      }

      // Solicitar conexión
      await provider.request({ method: 'eth_requestAccounts' });

      const web3Provider = new ethers.providers.Web3Provider(provider);
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();
      const network = await web3Provider.getNetwork();

      this.provider = web3Provider;
      this.signer = signer;
      this.address = address;
      this.chainId = network.chainId;
      this.isConnected = true;

      // Setup event listeners
      this.setupEventListeners(provider);

      return {
        success: true,
        address,
        chainId: network.chainId,
        networkName: network.name
      };

    } catch (error) {
      console.error('Error conectando MetaMask:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Desconectar wallet
  async disconnectWallet() {
    try {
      if (this.web3Modal) {
        await this.web3Modal.clearCachedProvider();
      }

      this.provider = null;
      this.signer = null;
      this.address = null;
      this.chainId = null;
      this.isConnected = false;

      return { success: true };
    } catch (error) {
      console.error('Error desconectando wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar si está conectado
  async isWalletConnected() {
    try {
      if (!this.provider) return false;

      const accounts = await this.provider.listAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Error verificando conexión:', error);
      return false;
    }
  }

  // Obtener balance
  async getBalance(address = null) {
    try {
      if (!this.provider) throw new Error('Wallet no conectado');

      const targetAddress = address || this.address;
      const balance = await this.provider.getBalance(targetAddress);

      return {
        success: true,
        balance: ethers.utils.formatEther(balance),
        balanceWei: balance.toString()
      };
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Cambiar red
  async switchNetwork(chainId) {
    try {
      if (!this.provider) throw new Error('Wallet no conectado');

      const chainIdHex = `0x${chainId.toString(16)}`;

      await this.provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      // Actualizar chainId local
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;

      return { success: true, chainId: network.chainId };
    } catch (error) {
      // Si la red no existe, intentar agregarla
      if (error.code === 4902) {
        return await this.addNetwork(chainId);
      }

      console.error('Error cambiando red:', error);
      return { success: false, error: error.message };
    }
  }

  // Agregar nueva red
  async addNetwork(chainId) {
    const networks = {
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        rpcUrls: ['https://polygon-rpc.com/'],
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        blockExplorerUrls: ['https://polygonscan.com/']
      },
      80001: {
        chainId: '0x13881',
        chainName: 'Mumbai Testnet',
        rpcUrls: ['https://rpc-mumbai.matic.today/'],
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18
        },
        blockExplorerUrls: ['https://mumbai.polygonscan.com/']
      }
    };

    try {
      const networkConfig = networks[chainId];
      if (!networkConfig) {
        throw new Error('Red no soportada');
      }

      await this.provider.provider.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });

      return { success: true };
    } catch (error) {
      console.error('Error agregando red:', error);
      return { success: false, error: error.message };
    }
  }

  // Firmar mensaje
  async signMessage(message) {
    try {
      if (!this.signer) throw new Error('Wallet no conectado');

      const signature = await this.signer.signMessage(message);

      return {
        success: true,
        signature,
        message,
        address: this.address
      };
    } catch (error) {
      console.error('Error firmando mensaje:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar transacción
  async sendTransaction(to, amount, data = '0x') {
    try {
      if (!this.signer) throw new Error('Wallet no conectado');

      const transaction = {
        to,
        value: ethers.utils.parseEther(amount.toString()),
        data
      };

      const tx = await this.signer.sendTransaction(transaction);

      return {
        success: true,
        hash: tx.hash,
        transaction: tx
      };
    } catch (error) {
      console.error('Error enviando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  // Setup event listeners para cambios de cuenta/red
  setupEventListeners(provider) {
    if (provider.on) {
      // Cambio de cuenta
      provider.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.address = accounts[0];
          // Emit custom event for UI updates
          window.dispatchEvent(new CustomEvent('walletAccountChanged', {
            detail: { address: accounts[0] }
          }));
        }
      });

      // Cambio de red
      provider.on('chainChanged', (chainId) => {
        this.chainId = parseInt(chainId, 16);
        // Emit custom event for UI updates
        window.dispatchEvent(new CustomEvent('walletChainChanged', {
          detail: { chainId: this.chainId }
        }));
      });

      // Desconexión
      provider.on('disconnect', () => {
        this.disconnectWallet();
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
      });
    }
  }

  // Obtener información de la wallet actual
  getWalletInfo() {
    return {
      address: this.address,
      chainId: this.chainId,
      isConnected: this.isConnected,
      provider: this.provider ? 'Connected' : null
    };
  }

  // Verificar si MetaMask está instalado
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  }

  // Obtener contratos ya instanciados
  getContract(contractAddress, abi) {
    if (!this.signer) {
      throw new Error('Wallet no conectado');
    }
    return new ethers.Contract(contractAddress, abi, this.signer);
  }
}

// Exportar instancia singleton
const walletService = new WalletService();
export default walletService;
