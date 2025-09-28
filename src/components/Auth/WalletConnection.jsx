import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useConnectors } from 'wagmi';
import walletService from '../../services/walletService';
import './WalletConnection.css';

const WalletConnection = ({ onConnectionChange }) => {
  // Hooks de wagmi para obtener estado de la wallet
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  
  const [balance, setBalance] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Actualizar servicio de wallet cuando cambie la conexión
  useEffect(() => {
    if (isConnected && address) {
      walletService.connectWallet().then(() => {
        if (onConnectionChange) {
          onConnectionChange(true, { address, chainId });
        }
        refreshBalance();
      });
    } else {
      if (onConnectionChange) {
        onConnectionChange(false, null);
      }
    }
  }, [isConnected, address, chainId]);

  // Refrescar balance
  const refreshBalance = async () => {
    if (!address) return;
    
    setIsRefreshing(true);
    try {
      const result = await walletService.getBalance(address);
      if (result.success) {
        setBalance(result.balance);
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manejar desconexión
  const handleDisconnect = () => {
    disconnect();
    walletService.disconnectWallet();
  };

  // Formatear dirección
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Si no está conectado, mostrar botón de RabbyKit
  if (!isConnected) {
    return (
      <div className="wallet-connection">
        <div className="wallet-modal">
          <h3>Conectar Wallet</h3>
          <p>Conecta tu wallet favorita usando RabbyKit</p>
          
          <div className="rabbykit-container">
            <ConnectButton />
          </div>
          
          <div className="supported-wallets">
            <p>Wallets soportadas:</p>
            <div className="wallet-icons">
              <span>🦊 MetaMask</span>
              <span>🌈 Rainbow</span>
              <span>🔷 Coinbase</span>
              <span>� Trust Wallet</span>
              <span>📱 WalletConnect</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si está conectado, mostrar información de la wallet
  return (
    <div className="wallet-connected">
      <div className="wallet-info-card">
        <div className="wallet-header">
          <div className="wallet-status">
            <div className="status-indicator connected"></div>
            <span>Wallet Conectado</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="disconnect-btn"
            title="Desconectar wallet"
          >
            Desconectar
          </button>
        </div>

        <div className="wallet-details">
          <div className="detail-row">
            <span className="label">Dirección:</span>
            <span className="value address" title={address}>
              {formatAddress(address)}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Red:</span>
            <span className="network-name">
              {chain?.name || 'Red desconocida'}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Balance:</span>
            <div className="balance-info">
              <span className="balance-amount">
                {balance ? `${parseFloat(balance).toFixed(4)} MATIC` : 'Cargando...'}
              </span>
              <button
                onClick={refreshBalance}
                className="refresh-btn"
                disabled={isRefreshing}
                title="Refrescar balance"
              >
                {isRefreshing ? '⏳' : '🔄'}
              </button>
            </div>
          </div>
        </div>

        {/* Botón avanzado de RabbyKit para cambiar red y wallet */}
        <div className="rabbykit-advanced">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </div>
  );
};

export default WalletConnection;
