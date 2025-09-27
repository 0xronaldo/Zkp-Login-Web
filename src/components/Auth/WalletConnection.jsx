import React, { useState } from 'react';
import useWallet from '../../hooks/useWallet';
import './WalletConnection.css';

const WalletConnection = ({ onConnectionChange }) => {
  const {
    wallet,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    refreshBalance,
    getNetworkName,
    formatAddress
  } = useWallet();

  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  // Manejar conexión de wallet
  const handleConnect = async (walletType = 'auto') => {
    const result = await connectWallet(walletType);
    if (result.success && onConnectionChange) {
      onConnectionChange(true, wallet);
    }
  };

  // Manejar desconexión
  const handleDisconnect = async () => {
    const result = await disconnectWallet();
    if (result.success && onConnectionChange) {
      onConnectionChange(false, null);
    }
  };

  // Cambiar red
  const handleNetworkSwitch = async (chainId) => {
    await switchNetwork(parseInt(chainId));
    setShowNetworkSelector(false);
  };

  // Redes soportadas
  const supportedNetworks = [
    { chainId: 1, name: 'Ethereum Mainnet', color: '#627EEA' },
    { chainId: 137, name: 'Polygon', color: '#8247E5' },
    { chainId: 80001, name: 'Mumbai Testnet', color: '#8247E5' },
    { chainId: 5, name: 'Goerli Testnet', color: '#627EEA' }
  ];

  if (!wallet.isConnected) {
    return (
      <div className="wallet-connection">
        <div className="wallet-connect-container">
          <h3>Conectar Wallet</h3>
          <p>Para continuar, conecta tu wallet de criptomonedas</p>

          <div className="wallet-options">
            {/* MetaMask Option */}
            <div className="wallet-option">
              <button
                onClick={() => handleConnect('metamask')}
                disabled={wallet.isLoading}
                className={`wallet-btn metamask-btn ${!isMetaMaskInstalled ? 'disabled' : ''}`}
              >
                <div className="wallet-icon">
                  <img src="/metamask-logo.png" alt="MetaMask" onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }} />
                  <div className="wallet-icon-fallback" style={{display: 'none'}}>🦊</div>
                </div>
                <div className="wallet-info">
                  <span className="wallet-name">MetaMask</span>
                  <span className="wallet-description">
                    {isMetaMaskInstalled ? 'Conectar con MetaMask' : 'Instalar MetaMask'}
                  </span>
                </div>
              </button>
              {!isMetaMaskInstalled && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="install-link"
                >
                  Instalar MetaMask
                </a>
              )}
            </div>

            {/* WalletConnect Option */}
            <div className="wallet-option">
              <button
                onClick={() => handleConnect('auto')}
                disabled={wallet.isLoading}
                className="wallet-btn walletconnect-btn"
              >
                <div className="wallet-icon">🔗</div>
                <div className="wallet-info">
                  <span className="wallet-name">WalletConnect</span>
                  <span className="wallet-description">Conectar con código QR</span>
                </div>
              </button>
            </div>
          </div>

          {wallet.isLoading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <span>Conectando wallet...</span>
            </div>
          )}

          {wallet.error && (
            <div className="error-message">
              <span>❌ {wallet.error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

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
            disabled={wallet.isLoading}
          >
            Desconectar
          </button>
        </div>

        <div className="wallet-details">
          <div className="detail-row">
            <span className="label">Dirección:</span>
            <span className="value address" title={wallet.address}>
              {formatAddress(wallet.address)}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Red:</span>
            <div className="network-info">
              <span className="network-name">
                {getNetworkName(wallet.chainId)}
              </span>
              <button
                onClick={() => setShowNetworkSelector(!showNetworkSelector)}
                className="change-network-btn"
              >
                Cambiar
              </button>
            </div>
          </div>

          <div className="detail-row">
            <span className="label">Balance:</span>
            <div className="balance-info">
              <span className="balance-amount">
                {parseFloat(wallet.balance).toFixed(4)} ETH
              </span>
              <button
                onClick={refreshBalance}
                className="refresh-btn"
                disabled={wallet.isLoading}
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {showNetworkSelector && (
          <div className="network-selector">
            <h4>Seleccionar Red</h4>
            <div className="network-list">
              {supportedNetworks.map((network) => (
                <button
                  key={network.chainId}
                  onClick={() => handleNetworkSwitch(network.chainId)}
                  className={`network-option ${wallet.chainId === network.chainId ? 'active' : ''}`}
                  disabled={wallet.isLoading}
                >
                  <div
                    className="network-indicator"
                    style={{ backgroundColor: network.color }}
                  ></div>
                  <span>{network.name}</span>
                  {wallet.chainId === network.chainId && <span className="checkmark">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {wallet.isLoading && (
          <div className="loading-overlay">
            <div className="spinner small"></div>
          </div>
        )}

        {wallet.error && (
          <div className="error-message small">
            <span>⚠️ {wallet.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnection;
