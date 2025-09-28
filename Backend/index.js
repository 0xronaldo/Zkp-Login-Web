/**
 * Backend Express.js para autenticación ZK Login
 * 
 * Este servidor maneja:
 * 1. Generación de pruebas ZK usando Circom y snarkjs
 * 2. Interacción con contratos inteligentes en Polygon Mumbai
 * 3. Verificación de pruebas ZK en blockchain
 * 4. Manejo de registro y autenticación de usuarios
 * 
 * Endpoints principales:
 * - POST /register-user: Registrar nuevo usuario con hash ZK
 * - POST /generate-proof: Generar prueba ZK para login
 * - POST /verify-proof: Verificar prueba ZK en blockchain
 * - POST /check-user: Verificar si usuario está registrado
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const { ethers } = require('ethers');
const snarkjs = require('snarkjs');
const crypto = require('crypto-js');
const fs = require('fs');
const path = require('path');

// Importar servicios personalizados
const ZKService = require('./services/zkService');
const BlockchainService = require('./services/blockchainService');
const PrivadoIDService = require('./services/privadoService');
const UserService = require('./services/userService');

// Importar utilidades
const logger = require('./utils/logger');
const { ValidationMiddleware } = require('./utils/validator');

// Crear instancia de Express
const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de middlewares
app.use(helmet()); // Seguridad básica
app.use(compression()); // Compresión gzip
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middlewares de seguridad y logging
app.use(logger.requestMiddleware()); // Logging personalizado
app.use(ValidationMiddleware.sanitizeInputs); // Sanitización
app.use(ValidationMiddleware.detectThreats); // Detección de amenazas

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta más tarde.'
});
app.use(limiter);

// Rate limiting específico para endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // solo 10 intentos de auth por IP
  message: 'Demasiados intentos de autenticación, intenta más tarde.'
});

// Inicializar servicios
const zkService = new ZKService();
const blockchainService = new BlockchainService();
const privadoService = new PrivadoIDService();
const userService = new UserService();

/**
 * ================================
 * RUTAS DE SALUD Y STATUS
 * ================================
 */

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      zk: zkService.isReady(),
      blockchain: blockchainService.isConnected(),
      privado: privadoService.isConfigured()
    }
  });
});

// Información del sistema
app.get('/info', (req, res) => {
  res.json({
    name: 'ZK Login Backend',
    description: 'Servidor para autenticación con Zero-Knowledge Proofs',
    version: '1.0.0',
    endpoints: [
      'GET /health - Estado del servidor',
      'GET /info - Información del sistema',
      'POST /check-user - Verificar registro de usuario',
      'POST /register-user - Registrar nuevo usuario',
      'POST /generate-proof - Generar prueba ZK',
      'POST /verify-proof - Verificar prueba ZK'
    ],
    networks: {
      amoy: {
          chainId: 80002,
          rpc: process.env.AMOY_RPC_URL,
          contracts: {
            register: process.env.REGISTER_CONTRACT_ADDRESS,
            verifier: process.env.VERIFIER_CONTRACT_ADDRESS
          }
        },
        mumbai: {
          chainId: 80001,
          rpc: process.env.MUMBAI_RPC_URL,
          contracts: {
            register: process.env.REGISTER_CONTRACT_ADDRESS,
            verifier: process.env.VERIFIER_CONTRACT_ADDRESS
          }
        }
    }
  });
});

/**
 * ================================
 * RUTAS DE AUTENTICACIÓN
 * ================================
 */

/**
 * Verificar si un usuario está registrado
 * POST /check-user
 * Body: { address: string }
 */
app.post('/check-user', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Dirección de wallet inválida'
      });
    }

    const isRegistered = await blockchainService.isUserRegistered(address);

    res.json({
      success: true,
      isRegistered,
      address,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verificando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * Registrar nuevo usuario
 * POST /register-user
 * Body: { username: string, email: string, address: string, passwordHash: string, chainId?: number }
 */
app.post('/register-user', 
  authLimiter, 
  ValidationMiddleware.validateUserRegistration,
  async (req, res) => {
  try {
    const { username, email, address, passwordHash, chainId = 80002 } = req.body;

    // Validaciones
    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario debe tener al menos 3 caracteres'
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Dirección de wallet inválida'
      });
    }

    if (!passwordHash || passwordHash.length !== 64) {
      return res.status(400).json({
        success: false,
        error: 'Hash de contraseña inválido'
      });
    }

    // Verificar si ya está registrado en blockchain
    const isRegistered = await blockchainService.isUserRegistered(address);
    if (isRegistered) {
      return res.status(409).json({
        success: false,
        error: 'Usuario ya registrado en blockchain'
      });
    }

    // Verificar duplicados en base de datos local
    try {
      if (userService.findByAddress(address)) {
        return res.status(409).json({
          success: false,
          error: 'Dirección de wallet ya registrada'
        });
      }

      if (userService.findByUsername(username)) {
        return res.status(409).json({
          success: false,
          error: 'Nombre de usuario ya está en uso'
        });
      }

      if (userService.findByEmail(email)) {
        return res.status(409).json({
          success: false,
          error: 'Email ya está registrado'
        });
      }
    } catch (error) {
      console.error('Error verificando duplicados:', error);
    }

    // Generar prueba ZK para registro
    console.log('Generando prueba ZK para registro...');
    const proofData = await zkService.generateRegistrationProof(passwordHash);

    if (!proofData.success) {
      return res.status(500).json({
        success: false,
        error: 'Error generando prueba ZK: ' + proofData.error
      });
    }

    // Registrar en blockchain
    console.log('Registrando usuario en blockchain...');
    const registrationResult = await blockchainService.registerUser(
      address,
      proofData.publicSignals,
      chainId
    );

    if (!registrationResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Error registrando en blockchain: ' + registrationResult.error
      });
    }

    // Guardar datos de usuario en base de datos local
    try {
      const newUser = userService.createUser({
        username,
        email,
        address,
        passwordHash,
        chainId
      });
      
      console.log('Usuario guardado en base de datos:', newUser.id);
    } catch (error) {
      console.error('Error guardando usuario en BD (no crítico):', error.message);
    }

    // Integración con privado.id (opcional)
    try {
      await privadoService.createUserDID(address, proofData.publicSignals);
    } catch (error) {
      console.warn('Error con privado.id (no crítico):', error.message);
    }

    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      transactionHash: registrationResult.transactionHash,
      user: {
        username,
        email,
        address
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en registro de usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno durante el registro'
    });
  }
});

/**
 * Generar prueba ZK para login
 * POST /generate-proof
 * Body: { address: string, passwordHash: string, chainId?: number }
 */
app.post('/generate-proof', 
  authLimiter, 
  ValidationMiddleware.validateProofGeneration,
  async (req, res) => {
  try {
    const { address, passwordHash, chainId = 80002 } = req.body;

    // Validaciones
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Dirección de wallet inválida'
      });
    }

    if (!passwordHash || passwordHash.length !== 64) {
      return res.status(400).json({
        success: false,
        error: 'Hash de contraseña inválido'
      });
    }

    // Verificar si usuario está registrado
    const isRegistered = await blockchainService.isUserRegistered(address);
    if (!isRegistered) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no registrado'
      });
    }

    // Generar prueba ZK
    console.log('Generando prueba ZK para login...');
    const proofData = await zkService.generateLoginProof(passwordHash, address);

    if (!proofData.success) {
      return res.status(500).json({
        success: false,
        error: 'Error generando prueba ZK: ' + proofData.error
      });
    }

    res.json({
      success: true,
      proof: proofData.proof,
      publicSignals: proofData.publicSignals,
      address,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generando prueba:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno generando prueba'
    });
  }
});

/**
 * Verificar prueba ZK en blockchain
 * POST /verify-proof
 * Body: { address: string, proof: object, publicSignals: array, chainId?: number }
 */
app.post('/verify-proof', 
  authLimiter, 
  ValidationMiddleware.validateProofVerification,
  async (req, res) => {
  try {
    const { address, proof, publicSignals, chainId = 80002 } = req.body;

    // Validaciones
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Dirección de wallet inválida'
      });
    }

    if (!proof || !publicSignals) {
      return res.status(400).json({
        success: false,
        error: 'Prueba o señales públicas faltantes'
      });
    }

    // Verificar prueba localmente primero
    const localVerification = await zkService.verifyProof(proof, publicSignals);
    if (!localVerification.success || !localVerification.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Prueba ZK inválida'
      });
    }

    // Verificar en blockchain
    console.log('Verificando prueba en blockchain...');
    const blockchainVerification = await blockchainService.verifyProof(
      address,
      proof,
      publicSignals,
      chainId
    );

    if (!blockchainVerification.success) {
      return res.status(500).json({
        success: false,
        error: 'Error verificando en blockchain'
      });
    }

    // Verificación adicional con privado.id
    let privadoVerification = null;
    try {
      privadoVerification = await privadoService.verifyUserProof(address, proof);
    } catch (error) {
      console.warn('Error con privado.id (no crítico):', error.message);
    }

    res.json({
      success: true,
      isValid: blockchainVerification.isValid,
      address,
      verifications: {
        local: localVerification.isValid,
        blockchain: blockchainVerification.isValid,
        privado: privadoVerification?.isValid || null
      },
      transactionHash: blockchainVerification.transactionHash,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verificando prueba:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno verificando prueba'
    });
  }
});

/**
 * ================================
 * RUTAS DE DESARROLLO/DEBUG
 * ================================
 */

// Solo en modo desarrollo
if (process.env.NODE_ENV === 'development') {
  app.get('/debug/circuits', async (req, res) => {
    try {
      const circuitInfo = await zkService.getCircuitInfo();
      res.json(circuitInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/debug/contracts', async (req, res) => {
    try {
      const contractInfo = await blockchainService.getContractInfo();
      res.json(contractInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

/**
 * ================================
 * MANEJO DE ERRORES Y 404
 * ================================
 */

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    availableEndpoints: ['/health', '/info', '/check-user', '/register-user', '/generate-proof', '/verify-proof']
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  logger.error('Error no manejado', error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

/**
 * ================================
 * INICIALIZACIÓN DEL SERVIDOR
 * ================================
 */

// Función de inicialización asíncrona
async function initializeServer() {
  try {
    logger.info('🚀 Inicializando servidor ZK Login...');

    // Verificar archivos de circuitos
    await zkService.initialize();
    logger.info('✅ Servicio ZK inicializado');

    // Conectar a blockchain
    await blockchainService.initialize();
    logger.info('✅ Servicio blockchain inicializado');

    // Configurar privado.id
    await privadoService.initialize();
    logger.info('✅ Servicio privado.id configurado');

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info('🎉 Servidor iniciado exitosamente!', {
        port: PORT,
        mode: process.env.NODE_ENV || 'development',
        network: process.env.NETWORK_NAME || 'Amoy Testnet',
        urls: {
          server: `http://localhost:${PORT}`,
          health: `http://localhost:${PORT}/health`,
          info: `http://localhost:${PORT}/info`
        }
      });
      
      console.log(`\n🎉 Servidor iniciado exitosamente!`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Info: http://localhost:${PORT}/info`);
      console.log(`🔐 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⛓️  Red: ${process.env.NETWORK_NAME || 'Mumbai Testnet'}`);
      console.log(`=====================================\n`);
    });

  } catch (error) {
    logger.error('❌ Error inicializando servidor', error);
    console.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  process.exit(0);
});

// Inicializar servidor
initializeServer();

module.exports = app;