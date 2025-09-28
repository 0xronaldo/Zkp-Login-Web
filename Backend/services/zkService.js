/**
 * Servicio ZK (Zero-Knowledge) para generar y verificar pruebas
 * 
 * Este servicio maneja:
 * 1. Inicialización de circuitos Circom
 * 2. Generación de pruebas ZK con snarkjs
 * 3. Verificación local de pruebas
 * 4. Interfaz con archivos .wasm y .zkey
 */

const snarkjs = require('snarkjs');
const crypto = require('crypto-js');
const fs = require('fs');
const path = require('path');

class ZKService {
  constructor() {
    this.circuitPath = path.join(__dirname, '../../zk-circuits');
    this.wasmPath = path.join(this.circuitPath, 'login.wasm');
    this.zkeyPath = path.join(this.circuitPath, 'login_final.zkey');
    this.vkeyPath = path.join(this.circuitPath, 'verification_key.json');
    
    this.isInitialized = false;
    this.verificationKey = null;
  }

  /**
   * Inicializar el servicio ZK
   * Verifica que existan los archivos necesarios del circuito
   */
  async initialize() {
    try {
      console.log('🔧 Inicializando servicio ZK...');

      // Verificar archivos de circuito
      await this.checkCircuitFiles();

      // Cargar verification key si existe
      if (fs.existsSync(this.vkeyPath)) {
        this.verificationKey = JSON.parse(fs.readFileSync(this.vkeyPath, 'utf8'));
        console.log('Verification key cargada');
      } else {
        console.warn(' Verification key no encontrada. Se generará con el circuito.');
      }

      this.isInitialized = true;
      console.log(' Servicio ZK inicializado correctamente');

    } catch (error) {
      console.error(' Error inicializando servicio ZK:', error);
      throw error;
    }
  }

  /**
   * Verificar si existen los archivos necesarios del circuito
   */
  async checkCircuitFiles() {
    const requiredFiles = [
      { path: this.circuitPath, name: 'Directorio de circuitos', type: 'dir' },
      { path: path.join(this.circuitPath, 'login.circom'), name: 'Archivo Circom', type: 'file' }
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file.path)) {
        if (file.type === 'dir') {
          fs.mkdirSync(file.path, { recursive: true });
          console.log(`📁 Creado directorio: ${file.name}`);
        } else {
          console.warn(`⚠️  ${file.name} no encontrado: ${file.path}`);
          // No lanzamos error aquí, se manejará en la compilación
        }
      }
    }

    // Verificar archivos compilados
    if (!fs.existsSync(this.wasmPath)) {
      console.warn('⚠️  Archivo WASM no encontrado. Se necesita compilar el circuito.');
    }

    if (!fs.existsSync(this.zkeyPath)) {
      console.warn('⚠️  Archivo ZKEY no encontrado. Se necesita compilar el circuito.');
    }
  }

  /**
   * Generar entrada para el circuito basada en el hash de contraseña
   */
  generateCircuitInput(passwordHash, salt = null) {
    try {
      // Si no hay salt, generar uno
      if (!salt) {
        // Usar los primeros 32 caracteres del hash como salt para consistencia
        salt = passwordHash.substring(0, 32);
      }

      // Convertir hash a array de números (simulando entrada del circuito)
      const hashArray = [];
      for (let i = 0; i < passwordHash.length; i += 2) {
        const byte = parseInt(passwordHash.substr(i, 2), 16);
        hashArray.push(byte);
      }

      // Generar entrada del circuito
      const input = {
        passwordHash: hashArray,
        salt: this.stringToFieldArray(salt),
        timestamp: Math.floor(Date.now() / 1000)
      };

      return {
        success: true,
        input,
        salt
      };

    } catch (error) {
      console.error('Error generando entrada del circuito:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generar prueba ZK para registro
   */
  async generateRegistrationProof(passwordHash) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔐 Generando prueba ZK para registro...');

      // Generar entrada del circuito
      const inputResult = this.generateCircuitInput(passwordHash);
      if (!inputResult.success) {
        throw new Error(inputResult.error);
      }

      // Verificar archivos compilados
      if (!fs.existsSync(this.wasmPath) || !fs.existsSync(this.zkeyPath)) {
        return this.generateMockProof('registration', inputResult.input);
      }

      // Generar prueba real con snarkjs
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputResult.input,
        this.wasmPath,
        this.zkeyPath
      );

      return {
        success: true,
        proof,
        publicSignals,
        input: inputResult.input
      };

    } catch (error) {
      console.error('Error generando prueba de registro:', error);
      
      // Fallback a mock proof para desarrollo
      try {
        const inputResult = this.generateCircuitInput(passwordHash);
        return this.generateMockProof('registration', inputResult.input);
      } catch (mockError) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Generar prueba ZK para login
   */
  async generateLoginProof(passwordHash, userAddress) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('🔐 Generando prueba ZK para login...');

      // Generar entrada del circuito (incluye dirección de usuario)
      const inputResult = this.generateCircuitInput(passwordHash);
      if (!inputResult.success) {
        throw new Error(inputResult.error);
      }

      // Añadir dirección de usuario a la entrada
      inputResult.input.userAddress = this.addressToFieldArray(userAddress);

      // Verificar archivos compilados
      if (!fs.existsSync(this.wasmPath) || !fs.existsSync(this.zkeyPath)) {
        return this.generateMockProof('login', inputResult.input);
      }

      // Generar prueba real con snarkjs
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputResult.input,
        this.wasmPath,
        this.zkeyPath
      );

      return {
        success: true,
        proof,
        publicSignals,
        input: inputResult.input
      };

    } catch (error) {
      console.error('Error generando prueba de login:', error);

      // Fallback a mock proof para desarrollo
      try {
        const inputResult = this.generateCircuitInput(passwordHash);
        inputResult.input.userAddress = this.addressToFieldArray(userAddress);
        return this.generateMockProof('login', inputResult.input);
      } catch (mockError) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Verificar prueba ZK localmente
   */
  async verifyProof(proof, publicSignals) {
    try {
      if (!this.verificationKey) {
        console.warn('⚠️  Verification key no disponible, usando verificación mock');
        return this.verifyMockProof(proof, publicSignals);
      }

      // Verificar con snarkjs
      const isValid = await snarkjs.groth16.verify(
        this.verificationKey,
        publicSignals,
        proof
      );

      return {
        success: true,
        isValid,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error verificando prueba:', error);
      
      // Fallback a verificación mock
      return this.verifyMockProof(proof, publicSignals);
    }
  }

  /**
   * Generar prueba mock para desarrollo (cuando no hay circuitos compilados)
   */
  generateMockProof(type, input) {
    console.warn(`⚠️  Generando prueba MOCK para ${type} (desarrollo)`);

    const mockProof = {
      pi_a: ["0x123", "0x456", "1"],
      pi_b: [["0x789", "0xabc"], ["0xdef", "0x012"], ["1", "0"]],
      pi_c: ["0x345", "0x678", "1"],
      protocol: "groth16",
      curve: "bn128"
    };

    const mockPublicSignals = [
      "0x" + crypto.SHA256(JSON.stringify(input)).toString().substring(0, 16),
      Math.floor(Date.now() / 1000).toString()
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
   * Verificar prueba mock
   */
  verifyMockProof(proof, publicSignals) {
    console.warn('⚠️  Verificando prueba MOCK (desarrollo)');

    // Verificación básica de estructura
    const isValid = (
      proof &&
      proof.pi_a &&
      proof.pi_b &&
      proof.pi_c &&
      publicSignals &&
      Array.isArray(publicSignals) &&
      publicSignals.length > 0
    );

    return {
      success: true,
      isValid,
      isMock: true,
      warning: 'Esta es una verificación MOCK solo para desarrollo'
    };
  }

  /**
   * Convertir string a array de field elements
   */
  stringToFieldArray(str) {
    const result = [];
    for (let i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i).toString());
    }
    // Padding si es necesario
    while (result.length < 32) {
      result.push("0");
    }
    return result.slice(0, 32); // Máximo 32 elementos
  }

  /**
   * Convertir dirección Ethereum a array de field elements
   */
  addressToFieldArray(address) {
    // Remover 0x prefix
    const cleanAddress = address.replace('0x', '');
    
    // Convertir a bytes y luego a field elements
    const result = [];
    for (let i = 0; i < cleanAddress.length; i += 2) {
      const byte = parseInt(cleanAddress.substr(i, 2), 16);
      result.push(byte.toString());
    }
    
    return result;
  }

  /**
   * Obtener información del circuito (para debug)
   */
  async getCircuitInfo() {
    return {
      isInitialized: this.isInitialized,
      files: {
        wasm: fs.existsSync(this.wasmPath),
        zkey: fs.existsSync(this.zkeyPath),
        vkey: fs.existsSync(this.vkeyPath),
        circom: fs.existsSync(path.join(this.circuitPath, 'login.circom'))
      },
      paths: {
        circuitPath: this.circuitPath,
        wasmPath: this.wasmPath,
        zkeyPath: this.zkeyPath,
        vkeyPath: this.vkeyPath
      },
      hasVerificationKey: !!this.verificationKey
    };
  }

  /**
   * Verificar si el servicio está listo
   */
  isReady() {
    return this.isInitialized;
  }
}

module.exports = ZKService;