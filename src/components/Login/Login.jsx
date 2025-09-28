import React, { useState, useEffect } from 'react';
import { sha256 } from 'js-sha256';
import axios from 'axios';
import WalletConnection from '../Auth/WalletConnection';
import useWallet from '../../hooks/useWallet';
import zkProofService from '../../services/zkProofService';
import './Login.css';

/**
 * Componente Login Principal
 * 
 * Este componente maneja el flujo completo de autenticación usando ZKproof:
 * 1. Conexión de wallet (MetaMask/WalletConnect)
 * 2. Formulario de contraseña
 * 3. Generación de prueba ZK
 * 4. Verificación en blockchain
 * 
 * Flujo de funcionamiento:
 * - Usuario conecta su wallet
 * - Usuario ingresa contraseña
 * - Se genera hash SHA256 de la contraseña
 * - Se envía al backend para generar prueba ZK
 * - Se verifica la prueba en el contrato inteligente
 */
const Login = () => {
  // Estados del componente para login
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Estados para formulario de registro
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Hook personalizado para manejar wallet
  const { wallet } = useWallet();

  // URL del backend (cambia según tu configuración)
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  /**
   * Inicializar servicio ZK al montar el componente
   */
  useEffect(() => {
    const initializeZKService = async () => {
      try {
        await zkProofService.initialize();
        console.log('Servicio ZKProof inicializado');
      } catch (error) {
        console.warn('Error inicializando ZKProof service:', error);
      }
    };

    initializeZKService();
  }, []);

  /**
   * Efecto para limpiar mensajes después de 5 segundos
   */
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  /**
   * Mostrar mensaje al usuario
   */
  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  /**
   * Generar hash SHA256 de la contraseña
   * En un entorno real, añadirías salt y múltiples iteraciones
   */
  const hashPassword = (pwd) => {
    return sha256(pwd);
  };

  /**
   * Validar formato de email
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Manejar cambios en el formulario de registro
   */
  const handleRegisterInputChange = (field, value) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Cambiar entre formularios de login y registro
   */
  const toggleForm = () => {
    setShowRegisterForm(!showRegisterForm);
    setMessage('');
    setPassword('');
    setRegisterData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  /**
   * Verificar si el usuario ya está registrado
   */
  const checkUserRegistration = async () => {
    if (!wallet.address) return;

    try {
      showMessage('Verificando registro de usuario...', 'info');
      
      const response = await axios.post(`${BACKEND_URL}/check-user`, {
        address: wallet.address
      });

      if (response.data.success) {
        setIsRegistered(response.data.isRegistered);
        if (!response.data.isRegistered) {
          showMessage('Usuario no registrado. Debe registrarse primero.', 'info');
        }
      }
    } catch (error) {
      console.error('Error verificando registro:', error);
      showMessage('Error verificando registro de usuario', 'error');
    }
  };

  /**
   * Manejar registro de nuevo usuario
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validar datos del formulario
    if (!registerData.username.trim()) {
      showMessage('Por favor ingresa un nombre de usuario', 'error');
      return;
    }

    if (!registerData.email.trim()) {
      showMessage('Por favor ingresa un email', 'error');
      return;
    }

    if (!isValidEmail(registerData.email)) {
      showMessage('Por favor ingresa un email válido', 'error');
      return;
    }

    if (!registerData.password.trim()) {
      showMessage('Por favor ingresa una contraseña', 'error');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      showMessage('Las contraseñas no coinciden', 'error');
      return;
    }

    if (registerData.password.length < 6) {
      showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    if (!wallet.isConnected) {
      showMessage('Por favor conecta tu wallet primero', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Validar entrada para ZK
      const validation = zkProofService.validateInput(registerData.password, wallet.address);
      if (!validation.isValid) {
        showMessage(validation.errors.join(', '), 'error');
        return;
      }

      showMessage('Generando prueba ZK para registro...', 'info');

      // Generar prueba ZK en el frontend
      const proofResult = await zkProofService.generateLoginProof(registerData.password, wallet.address);

      if (!proofResult.success) {
        throw new Error('Error generando prueba ZK');
      }

      // Mostrar advertencia si es mock
      if (proofResult.isMock) {
        showMessage('⚠️ Usando prueba MOCK para desarrollo', 'info');
      }

      showMessage('Registrando en blockchain...', 'info');

      // Enviar al backend para registro con datos completos
      const response = await axios.post(`${BACKEND_URL}/register-user`, {
        username: registerData.username,
        email: registerData.email,
        address: wallet.address,
        passwordHash: hashPassword(registerData.password),
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        chainId: wallet.chainId
      });

      if (response.data.success) {
        showMessage('¡Usuario registrado exitosamente!', 'success');
        setIsRegistered(true);
        setPassword('');
        
        // Mostrar hash de transacción si está disponible
        if (response.data.transactionHash) {
          console.log('Transacción de registro:', response.data.transactionHash);
        }
      } else {
        showMessage(`Error en registro: ${response.data.error}`, 'error');
      }

    } catch (error) {
      console.error('Error en registro:', error);
      showMessage(
        error.response?.data?.error || 'Error desconocido durante el registro',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Manejar login con ZKproof
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      showMessage('Por favor ingresa tu contraseña', 'error');
      return;
    }

    if (!wallet.isConnected) {
      showMessage('Por favor conecta tu wallet primero', 'error');
      return;
    }

    if (!isRegistered) {
      showMessage('Usuario no registrado. Registrate primero.', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Validar entrada
      const validation = zkProofService.validateInput(password, wallet.address);
      if (!validation.isValid) {
        showMessage(validation.errors.join(', '), 'error');
        return;
      }

      showMessage('Generando prueba ZK localmente...', 'info');

      // Generar prueba ZK en el frontend
      const proofResult = await zkProofService.generateLoginProof(password, wallet.address);

      if (!proofResult.success) {
        throw new Error('Error generando prueba ZK');
      }

      // Mostrar advertencia si es mock
      if (proofResult.isMock) {
        showMessage('Usando prueba MOCK para desarrollo', 'info');
      }

      showMessage('Verificando prueba en blockchain...', 'info');

      // Enviar prueba para verificación en backend
      const verifyResponse = await axios.post(`${BACKEND_URL}/verify-proof`, {
        address: wallet.address,
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        chainId: wallet.chainId
      });

      if (verifyResponse.data.success && verifyResponse.data.isValid) {
        showMessage('¡Login exitoso! Bienvenido 🎉', 'success');
        
        // Mostrar información adicional de verificación
        if (verifyResponse.data.verifications) {
          const verifs = verifyResponse.data.verifications;
          console.log('Verificaciones:', {
            local: verifs.local,
            blockchain: verifs.blockchain,
            privado: verifs.privado
          });
        }

        // Aquí puedes redirigir al dashboard o área protegida
        // setTimeout(() => window.location.href = '/dashboard', 2000);
        
      } else {
        showMessage('Credenciales inválidas o prueba ZK no válida', 'error');
      }

    } catch (error) {
      console.error('Error en login:', error);
      showMessage(
        error.response?.data?.error || 'Error desconocido durante el login',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Manejar cambio de wallet
   */
  const handleWalletConnection = (connected, walletInfo) => {
    if (connected) {
      showMessage(`Wallet conectado: ${walletInfo?.address}`, 'success');
      // Verificar registro del usuario
      setTimeout(() => checkUserRegistration(), 1000);
    } else {
      showMessage('Wallet desconectado', 'info');
      setIsRegistered(false);
      setPassword('');
    }
  };

  /**
   * Demo/Testing: Generar contraseña de ejemplo
   */
  const generateDemoPassword = () => {
    const demoPassword = 'demo123456';
    setPassword(demoPassword);
    showMessage('Contraseña de demo cargada', 'info');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1>🔐 ZK Login</h1>
          <p>Autenticación segura con Zero-Knowledge Proofs</p>
        </div>

        {/* Conexión de Wallet */}
        <div className="wallet-section">
          <WalletConnection onConnectionChange={handleWalletConnection} />
        </div>

        {/* Formulario de Login/Registro */}
        {wallet.isConnected && (
          <div className="form-section">
            {/* Información del usuario */}
            <div className="user-info">
              <div className="info-row">
                <span className="label">Estado:</span>
                <span className={`status ${isRegistered ? 'registered' : 'not-registered'}`}>
                  {isRegistered ? '✅ Registrado' : '❌ No registrado'}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Red:</span>
                <span className="network">
                  {wallet.chainId === 80002 ? 'Amoy Testnet' : wallet.chainId === 80001 ? 'Mumbai Testnet' : `Chain ${wallet.chainId}`}
                </span>
              </div>
            </div>

            {/* Selector de formulario */}
            <div className="form-selector">
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className={`form-tab ${!showRegisterForm ? 'active' : ''}`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterForm(true)}
                className={`form-tab ${showRegisterForm ? 'active' : ''}`}
              >
                Registrarse
              </button>
            </div>

            {/* Formulario de Login */}
            {!showRegisterForm ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="login-password">Contraseña:</label>
                  <div className="password-input-container">
                    <input
                      type="password"
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      disabled={isProcessing}
                      className="password-input"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={generateDemoPassword}
                      className="demo-btn"
                      disabled={isProcessing}
                      title="Cargar contraseña de demo"
                    >
                      🎲
                    </button>
                  </div>
                  <small className="password-hint">
                    Ingresa la contraseña con la que te registraste
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner"></span>
                        Verificando...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Formulario de Registro */
              <form className="auth-form register-form" onSubmit={handleRegister}>
                <div className="form-group">
                  <label htmlFor="username">Nombre de Usuario:</label>
                  <input
                    type="text"
                    id="username"
                    value={registerData.username}
                    onChange={(e) => handleRegisterInputChange('username', e.target.value)}
                    placeholder="Ej: juan_perez"
                    disabled={isProcessing}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    value={registerData.email}
                    onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    disabled={isProcessing}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="register-password">Contraseña:</label>
                  <input
                    type="password"
                    id="register-password"
                    value={registerData.password}
                    onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isProcessing}
                    className="password-input"
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirmar Contraseña:</label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={registerData.confirmPassword}
                    onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                    placeholder="Repite tu contraseña"
                    disabled={isProcessing}
                    className="password-input"
                    minLength={6}
                    required
                  />
                  {registerData.password && registerData.confirmPassword && 
                   registerData.password !== registerData.confirmPassword && (
                    <small className="error-hint">Las contraseñas no coinciden</small>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn register"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner"></span>
                        Registrando...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Información técnica */}
            <div className="tech-info">
              <details>
                <summary>ℹ️ Información técnica</summary>
                <div className="tech-details">
                  <p><strong>Proceso de autenticación:</strong></p>
                  <ol>
                    <li>Se genera un hash SHA256 de tu contraseña</li>
                    <li>Se crea una prueba ZK usando Circom + snarkjs</li>
                    <li>La prueba se verifica en el contrato inteligente</li>
                    <li>No se almacena tu contraseña real en ningún lugar</li>
                  </ol>
                  <p><strong>Red:</strong> {wallet.chainId === 80002 ? 'Polygon Amoy Testnet' : wallet.chainId === 80001 ? 'Polygon Mumbai Testnet (Deprecated)' : 'Otra red'}</p>
                  <p><strong>Backend:</strong> {BACKEND_URL}</p>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {message && (
          <div className={`message-container ${messageType}`}>
            <div className="message-content">
              <span className="message-text">{message}</span>
              <button 
                className="close-message"
                onClick={() => setMessage('')}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Estado de procesamiento */}
        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-content">
              <div className="large-spinner"></div>
              <p>Procesando solicitud...</p>
              <small>Esto puede tomar unos segundos</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;