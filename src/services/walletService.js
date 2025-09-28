import { ethers, BrowserProvider, formatEther, parseEther } from 'ethers';
import { getAccount, getNetwork, switchNetwork, disconnect } from '@wagmi/core';
import { config } from '../config/rabbykit';

class WalletService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Conectar wallet usando RabbyKit
  async connectWallet() {
    try {
      // RabbyKit maneja la conexión automáticamente
      // Solo necesitamos obtener los datos actuales
      const account = getAccount(config);
      const network = getNetwork(config);

      if (account.address) {
        // Crear provider desde el conector actual
        if (window.ethereum) {
          this.provider = new BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
        }

        this.address = account.address;
        this.chainId = network.chain?.id;
        this.isConnected = account.isConnected;

        return {
          success: true,
          address: account.address,
          chainId: network.chain?.id,
          networkName: network.chain?.name
        };
      } else {
        throw new Error('No hay wallet conectado');
      }

    } catch (error) {
      console.error('Error conectando wallet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Desconectar wallet usando wagmi
  async disconnectWallet() {
    try {
      await disconnect(config);

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

  // Verificar si está conectado usando wagmi
  async isWalletConnected() {
    try {
      const account = getAccount(config);
      return account.isConnected;
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
        balance: formatEther(balance),
        balanceWei: balance.toString()
      };
    } catch (error) {
      console.error('Error obteniendo balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Cambiar red usando wagmi
  async switchNetwork(chainId) {
    try {
      await switchNetwork(config, { chainId });
      
      // Actualizar chainId local
      this.chainId = chainId;

      return { success: true, chainId };
    } catch (error) {
      console.error('Error cambiando red:', error);
      return { success: false, error: error.message };
    }
  }

  // Las redes se configuran automáticamente en RabbyKit

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
        value: parseEther(amount.toString()),
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

  // Obtener información de la wallet actual usando wagmi
  getWalletInfo() {
    const account = getAccount(config);
    const network = getNetwork(config);
    
    return {
      address: account.address,
      chainId: network.chain?.id,
      isConnected: account.isConnected,
      provider: account.connector?.name || null
    };
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
