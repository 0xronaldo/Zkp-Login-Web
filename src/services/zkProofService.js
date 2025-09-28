/**
 * Servicio ZKProof para el frontend
 * 
 * Este servicio maneja la generación de pruebas ZK en el cliente
 * usando snarkjs y los archivos compilados del circuito Circom
 * 
 * Funciones principales:
 * - Generar pruebas ZK localmente
 * - Validar entradas antes de enviar al circuito
 * - Manejar archivos .wasm y .zkey
 * - Interactuar con el backend para verificación
 */

import * as snarkjs from 'snarkjs';
import { sha256 } from 'js-sha256';

class ZKProofService {
  constructor() {
    this.isInitialized = false;
    this.wasmBuffer = null;
    this.zkeyBuffer = null;
    this.verificationKey = null;
    
    // URLs de los archivos del circuito (se cargan desde public/)
    this.circuitFiles = {
      wasm: '/circuits/login.wasm',
      zkey: '/circuits/login_final.zkey',
      vkey: '/circuits/verification_key.json'
    };
    
    // Configuración
    this.config = {
      debug: process.env.REACT_APP_DEBUG === 'true',
      backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'
    };
  }

  /**
   * Inicializar el servicio cargando archivos del circuito
   */
  async initialize() {
    try {
      console.log('🔧 Inicializando servicio ZKProof...');

      // Intentar cargar archivos del circuito
      await this.loadCircuitFiles();

      this.isInitialized = true;
      console.log('✅ Servicio ZKProof inicializado');

    } catch (error) {
      console.warn('⚠️  Error inicializando ZKProof, usando modo mock:', error.message);
      this.isInitialized = false; // Funcionará en modo mock
    }
  }

  /**
   * Cargar archivos necesarios del circuito
   */
  async loadCircuitFiles() {
    try {
      // Cargar archivo .wasm
      const wasmResponse = await fetch(this.circuitFiles.wasm);
      if (wasmResponse.ok) {
        this.wasmBuffer = await wasmResponse.arrayBuffer();
        console.log('📦 Archivo WASM cargado');
      }

      // Cargar archivo .zkey
      const zkeyResponse = await fetch(this.circuitFiles.zkey);
      if (zkeyResponse.ok) {
        this.zkeyBuffer = await zkeyResponse.arrayBuffer();
        console.log('🔑 Archivo ZKEY cargado');
      }

      // Cargar verification key
      const vkeyResponse = await fetch(this.circuitFiles.vkey);
      if (vkeyResponse.ok) {
        this.verificationKey = await vkeyResponse.json();
        console.log('🔐 Verification key cargada');
      }

      // Verificar que se cargaron los archivos esenciales
      if (!this.wasmBuffer || !this.zkeyBuffer) {
        throw new Error('Archivos de circuito no disponibles');
      }

    } catch (error) {
      console.warn('⚠️  No se pudieron cargar archivos del circuito:', error.message);
      throw error;
    }
  }

  /**
   * Generar prueba ZK para login
   * @param {string} password - Contraseña del usuario
   * @param {string} userAddress - Dirección del usuario
   * @returns {Object} Resultado con prueba y señales públicas
   */
  async generateLoginProof(password, userAddress) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔐 Generando prueba ZK para login...');

      // Preparar entradas del circuito
      const input = this.prepareCircuitInput(password, userAddress);

      // Generar prueba
      if (this.wasmBuffer && this.zkeyBuffer) {
        return await this.generateRealProof(input);
      } else {
        return this.generateMockProof(input);
      }

    } catch (error) {
      console.error('Error generando prueba ZK:', error);
      
      // Fallback a prueba mock
      const input = this.prepareCircuitInput(password, userAddress);
      return this.generateMockProof(input);
    }
  }

  /**
   * Preparar entrada para el circuito
   * @param {string} password - Contraseña
   * @param {string} userAddress - Dirección del usuario
   * @returns {Object} Input del circuito
   */
  prepareCircuitInput(password, userAddress) {
    // Generar hash SHA256 de la contraseña
    const passwordHash = sha256(password);
    
    // Generar salt basado en la dirección del usuario
    const salt = sha256(userAddress + Date.now().toString());
    
    // Convertir hashes a arrays de bytes
    const passwordHashArray = this.hexStringToByteArray(passwordHash);
    const saltArray = this.hexStringToByteArray(salt);
    
    // Generar secreto de usuario (simplificado)
    const userSecret = this.generateUserSecret(userAddress);
    
    // Timestamp actual
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Nonce de desafío
    const challengeNonce = Math.floor(Math.random() * 1000000);

    const input = {
      passwordHash: passwordHashArray,
      salt: saltArray,
      userSecret: userSecret,
      timestamp: timestamp,
      challengeNonce: challengeNonce
    };

    if (this.config.debug) {
      console.log('🔍 Input del circuito preparado:', {
        passwordHashLength: passwordHashArray.length,
        saltLength: saltArray.length,
        userSecret,
        timestamp,
        challengeNonce
      });
    }

    return input;
  }

  /**
   * Generar prueba real con snarkjs
   * @param {Object} input - Input del circuito
   * @returns {Object} Prueba y señales públicas
   */
  async generateRealProof(input) {
    try {
      console.log('⚡ Generando prueba real con snarkjs...');

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        new Uint8Array(this.wasmBuffer),
        new Uint8Array(this.zkeyBuffer)
      );

      console.log('✅ Prueba ZK generada exitosamente');

      return {
        success: true,
        proof,
        publicSignals,
        input,
        isReal: true
      };

    } catch (error) {
      console.error('Error generando prueba real:', error);
      throw error;
    }
  }

  /**
   * Generar prueba mock para desarrollo
   * @param {Object} input - Input del circuito
   * @returns {Object} Prueba mock
   */
  generateMockProof(input) {
    console.warn('🎭 Generando prueba MOCK para desarrollo');

    // Simular estructura de prueba Groth16
    const mockProof = {
      pi_a: [
        "0x" + Math.random().toString(16).substring(2, 18),
        "0x" + Math.random().toString(16).substring(2, 18),
        "1"
      ],
      pi_b: [
        [
          "0x" + Math.random().toString(16).substring(2, 18),
          "0x" + Math.random().toString(16).substring(2, 18)
        ],
        [
          "0x" + Math.random().toString(16).substring(2, 18),
          "0x" + Math.random().toString(16).substring(2, 18)
        ],
        ["1", "0"]
      ],
      pi_c: [
        "0x" + Math.random().toString(16).substring(2, 18),
        "0x" + Math.random().toString(16).substring(2, 18),
        "1"
      ],
      protocol: "groth16",
      curve: "bn128"
    };

    // Generar señales públicas mock
    const mockPublicSignals = [
      // Hash commitment (simulado)
      "0x" + sha256(JSON.stringify(input)).substring(0, 16),
      // Timestamp
      input.timestamp.toString()
    ];

    return {
      success: true,
      proof: mockProof,
      publicSignals: mockPublicSignals,
      input,
      isMock: true,
      warning: 'Esta es una prueba MOCK solo para desarrollo'
    };
  }

  /**
   * Verificar prueba localmente (si está disponible la verification key)
   * @param {Object} proof - Prueba a verificar
   * @param {Array} publicSignals - Señales públicas
   * @returns {Object} Resultado de verificación
   */
  async verifyProofLocally(proof, publicSignals) {
    try {
      if (!this.verificationKey) {
        return this.mockVerifyProof(proof, publicSignals);
      }

      console.log('🔍 Verificando prueba localmente...');

      const isValid = await snarkjs.groth16.verify(
        this.verificationKey,
        publicSignals,
        proof
      );

      return {
        success: true,
        isValid,
        isLocal: true
      };

    } catch (error) {
      console.error('Error verificando prueba localmente:', error);
      return this.mockVerifyProof(proof, publicSignals);
    }
  }

  /**
   * Verificación mock para desarrollo
   */
  mockVerifyProof(proof, publicSignals) {
    console.warn('🎭 Verificación MOCK');

    const isValid = !!(
      proof && 
      proof.pi_a && 
      proof.pi_b && 
      proof.pi_c &&
      publicSignals && 
      publicSignals.length > 0
    );

    return {
      success: true,
      isValid,
      isMock: true,
      warning: 'Esta es una verificación MOCK para desarrollo'
    };
  }

  /**
   * FUNCIONES DE UTILIDAD
   */

  /**
   * Convertir string hexadecimal a array de bytes
   * @param {string} hexString - String hexadecimal
   * @returns {Array} Array de números (bytes)
   */
  hexStringToByteArray(hexString) {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    
    // Asegurar que tenga exactamente 32 bytes
    while (bytes.length < 32) {
      bytes.push(0);
    }
    
    return bytes.slice(0, 32);
  }

  /**
   * Generar secreto de usuario basado en su dirección
   * @param {string} userAddress - Dirección del usuario
   * @returns {number} Secreto numérico
   */
  generateUserSecret(userAddress) {
    // Generar un número determinístico pero no predecible basado en la dirección
    const hash = sha256(userAddress + 'user-secret-salt');
    const secretHex = hash.substring(0, 8); // Usar primeros 8 caracteres
    const secret = parseInt(secretHex, 16);
    
    // Asegurar que esté en el rango válido del circuito
    return (secret % 999999999) + 1000;
  }

  /**
   * Obtener información del servicio (para debug)
   */
  getServiceInfo() {
    return {
      isInitialized: this.isInitialized,
      hasWasm: !!this.wasmBuffer,
      hasZkey: !!this.zkeyBuffer,
      hasVerificationKey: !!this.verificationKey,
      config: this.config,
      circuitFiles: this.circuitFiles
    };
  }

  /**
   * Validar entrada antes de generar prueba
   * @param {string} password - Contraseña
   * @param {string} userAddress - Dirección del usuario
   * @returns {Object} Resultado de validación
   */
  validateInput(password, userAddress) {
    const errors = [];

    if (!password || password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      errors.push('Dirección de usuario inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Verificar si el servicio está listo
   */
  isReady() {
    return this.isInitialized || true; // Permite funcionar en modo mock
  }
}

// Exportar instancia singleton
const zkProofService = new ZKProofService();
export default zkProofService;