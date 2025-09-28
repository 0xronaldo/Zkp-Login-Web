import { useState, useEffect, useCallback } from 'react';
import walletService from '../services/walletService';

const useWallet = () => {
  const [wallet, setWallet] = useState({
    address: null,
    chainId: null,
    isConnected: false,
    isLoading: false,
    error: null,
    balance: '0'
  });

  // Conectar wallet
  const connectWallet = useCallback(async (walletType = 'auto') => {
    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let result;

      if (walletType === 'metamask') {
        result = await walletService.connectMetaMask();
      } else {
        result = await walletService.connectWallet();
      }

      if (result.success) {
        setWallet(prev => ({
          ...prev,
          address: result.address,
          chainId: result.chainId,
          isConnected: true,
          isLoading: false,
          error: null
        }));

        // Obtener balance después de conectar
        const balanceResult = await walletService.getBalance();
        if (balanceResult.success) {
          setWallet(prev => ({ ...prev, balance: balanceResult.balance }));
        }

        return { success: true, data: result };
      } else {
        setWallet(prev => ({
          ...prev,
          isLoading: false,
          error: result.error
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error desconocido al conectar wallet';
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Desconectar wallet
  const disconnectWallet = useCallback(async () => {
    setWallet(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await walletService.disconnectWallet();

      if (result.success) {
        setWallet({
          address: null,
          chainId: null,
          isConnected: false,
          isLoading: false,
          error: null,
          balance: '0'
        });
        return { success: true };
      } else {
        setWallet(prev => ({ ...prev, isLoading: false, error: result.error }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al desconectar wallet';
      setWallet(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Cambiar red
  const switchNetwork = useCallback(async (chainId) => {
    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await walletService.switchNetwork(chainId);

      if (result.success) {
        setWallet(prev => ({
          ...prev,
          chainId: result.chainId,
          isLoading: false
        }));
        return { success: true };
      } else {
        setWallet(prev => ({ ...prev, isLoading: false, error: result.error }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Error al cambiar red';
      setWallet(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Obtener balance actualizado
  const refreshBalance = useCallback(async () => {
    if (!wallet.isConnected) return;

    try {
      const result = await walletService.getBalance();
      if (result.success) {
        setWallet(prev => ({ ...prev, balance: result.balance }));
        return { success: true, balance: result.balance };
      }
    } catch (error) {
      console.error('Error refrescando balance:', error);
      return { success: false, error: error.message };
    }
  }, [wallet.isConnected]);

  // Firmar mensaje
  const signMessage = useCallback(async (message) => {
    if (!wallet.isConnected) {
      return { success: false, error: 'Wallet no conectado' };
    }

    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await walletService.signMessage(message);
      setWallet(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Error firmando mensaje';
      setWallet(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [wallet.isConnected]);

  // Enviar transacción
  const sendTransaction = useCallback(async (to, amount, data) => {
    if (!wallet.isConnected) {
      return { success: false, error: 'Wallet no conectado' };
    }

    setWallet(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await walletService.sendTransaction(to, amount, data);
      setWallet(prev => ({ ...prev, isLoading: false }));

      // Actualizar balance después de la transacción
      if (result.success) {
        setTimeout(() => refreshBalance(), 2000); // Esperar confirmación
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Error enviando transacción';
      setWallet(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [wallet.isConnected, refreshBalance]);

  // Verificar conexión existente al cargar
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await walletService.isWalletConnected();
        if (isConnected) {
          const walletInfo = walletService.getWalletInfo();
          setWallet(prev => ({
            ...prev,
            address: walletInfo.address,
            chainId: walletInfo.chainId,
            isConnected: walletInfo.isConnected
          }));

          // Obtener balance si está conectado
          const balanceResult = await walletService.getBalance();
          if (balanceResult.success) {
            setWallet(prev => ({ ...prev, balance: balanceResult.balance }));
          }
        }
      } catch (error) {
        console.error('Error verificando conexión existente:', error);
      }
    };

    checkConnection();
  }, []);

  // Event listeners para cambios de wallet
  useEffect(() => {
    const handleAccountChanged = (event) => {
      const { address } = event.detail;
      setWallet(prev => ({ ...prev, address }));
      refreshBalance();
    };

    const handleChainChanged = (event) => {
      const { chainId } = event.detail;
      setWallet(prev => ({ ...prev, chainId }));
      refreshBalance();
    };

    const handleDisconnected = () => {
      setWallet({
        address: null,
        chainId: null,
        isConnected: false,
        isLoading: false,
        error: null,
        balance: '0'
      });
    };

    window.addEventListener('walletAccountChanged', handleAccountChanged);
    window.addEventListener('walletChainChanged', handleChainChanged);
    window.addEventListener('walletDisconnected', handleDisconnected);

    return () => {
      window.removeEventListener('walletAccountChanged', handleAccountChanged);
      window.removeEventListener('walletChainChanged', handleChainChanged);
      window.removeEventListener('walletDisconnected', handleDisconnected);
    };
  }, [refreshBalance]);

  // Limpiar error después de un tiempo
  useEffect(() => {
    if (wallet.error) {
      const timer = setTimeout(() => {
        setWallet(prev => ({ ...prev, error: null }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [wallet.error]);

  // Utilidades
  const isMetaMaskInstalled = walletService.isMetaMaskInstalled();

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      137: 'Polygon',
      80002: 'Amoy Testnet',
      80001: 'Mumbai Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet'
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return {
    // Estado
    wallet,
    isMetaMaskInstalled,

    // Acciones
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    signMessage,
    sendTransaction,

    // Utilidades
    getNetworkName,
    formatAddress,

    // Acceso directo al servicio para casos avanzados
    walletService
  };
};

export default useWallet;
