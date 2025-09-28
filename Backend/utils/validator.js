/**
 * Sistema de validación y sanitización para inputs
 * 
 * Proporciona validaciones comunes para:
 * - Direcciones Ethereum
 * - Datos de pruebas ZK
 * - Inputs de usuario
 * - Parámetros de API
 */

const { ethers } = require('ethers');

class Validator {
  /**
   * Validar dirección Ethereum
   */
  static isValidAddress(address) {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validar hash SHA256
   */
  static isValidSHA256(hash) {
    return typeof hash === 'string' && 
           hash.length === 64 && 
           /^[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Validar proof structure Groth16
   */
  static isValidGroth16Proof(proof) {
    try {
      return (
        proof &&
        Array.isArray(proof.pi_a) && proof.pi_a.length === 3 &&
        Array.isArray(proof.pi_b) && proof.pi_b.length === 3 &&
        Array.isArray(proof.pi_c) && proof.pi_c.length === 3 &&
        proof.protocol === 'groth16' &&
        proof.curve === 'bn128'
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Validar señales públicas
   */
  static isValidPublicSignals(signals) {
    return (
      Array.isArray(signals) &&
      signals.length > 0 &&
      signals.every(signal => typeof signal === 'string' || typeof signal === 'number')
    );
  }

  /**
   * Validar chain ID
   */
  static isValidChainId(chainId) {
    const validChains = [1, 3, 4, 5, 137, 80002, 80001, 56, 97]; // Mainnet, testnets (incluye Amoy)
    return Number.isInteger(chainId) && validChains.includes(chainId);
  }

  /**
   * Validar timestamp (no más de 1 hora de diferencia)
   */
  static isValidTimestamp(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.abs(now - timestamp);
    return Number.isInteger(timestamp) && diff <= 3600; // 1 hora
  }

  /**
   * Sanitizar string (remover caracteres peligrosos)
   */
  static sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    
    return str
      .trim()
      .replace(/[<>\"']/g, '') // Remover caracteres HTML peligrosos
      .substring(0, maxLength);
  }

  /**
   * Validar datos de registro de usuario
   */
  static validateUserRegistration(data) {
    const errors = [];

    if (!data.address || !this.isValidAddress(data.address)) {
      errors.push('Dirección de wallet inválida');
    }

    if (!data.passwordHash || !this.isValidSHA256(data.passwordHash)) {
      errors.push('Hash de contraseña inválido');
    }

    if (data.chainId && !this.isValidChainId(data.chainId)) {
      errors.push('Chain ID no soportado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar datos de generación de prueba
   */
  static validateProofGeneration(data) {
    const errors = [];

    if (!data.address || !this.isValidAddress(data.address)) {
      errors.push('Dirección de wallet inválida');
    }

    if (!data.passwordHash || !this.isValidSHA256(data.passwordHash)) {
      errors.push('Hash de contraseña inválido');
    }

    if (data.chainId && !this.isValidChainId(data.chainId)) {
      errors.push('Chain ID no soportado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar datos de verificación de prueba
   */
  static validateProofVerification(data) {
    const errors = [];

    if (!data.address || !this.isValidAddress(data.address)) {
      errors.push('Dirección de wallet inválida');
    }

    if (!data.proof || !this.isValidGroth16Proof(data.proof)) {
      errors.push('Estructura de prueba ZK inválida');
    }

    if (!data.publicSignals || !this.isValidPublicSignals(data.publicSignals)) {
      errors.push('Señales públicas inválidas');
    }

    if (data.chainId && !this.isValidChainId(data.chainId)) {
      errors.push('Chain ID no soportado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar parámetros de paginación
   */
  static validatePagination(offset, limit) {
    const errors = [];

    if (offset !== undefined) {
      if (!Number.isInteger(offset) || offset < 0) {
        errors.push('Offset debe ser un número entero no negativo');
      }
    }

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        errors.push('Limit debe ser un número entero entre 1 y 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detectar patrones de ataque comunes
   */
  static detectAttackPatterns(data) {
    const patterns = {
      sqlInjection: /(\b(union|select|insert|update|delete|drop|exec|script)\b)/i,
      xss: /<script|javascript:|onload=|onerror=/i,
      pathTraversal: /\.\.\//,
      commandInjection: /[;&|`$()]/
    };

    const threats = [];
    const dataStr = JSON.stringify(data).toLowerCase();

    Object.entries(patterns).forEach(([attack, pattern]) => {
      if (pattern.test(dataStr)) {
        threats.push(attack);
      }
    });

    return threats;
  }

  /**
   * Validar rate limiting
   */
  static isRateLimited(ip, requests, windowMs = 900000, maxRequests = 100) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Filtrar requests dentro de la ventana de tiempo
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return recentRequests.length >= maxRequests;
  }
}

/**
 * Middleware de validación para Express
 */
class ValidationMiddleware {
  /**
   * Middleware para validar registro de usuario
   */
  static validateUserRegistration(req, res, next) {
    const validation = Validator.validateUserRegistration(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Datos de registro inválidos',
        details: validation.errors
      });
    }

    // Detectar patrones de ataque
    const threats = Validator.detectAttackPatterns(req.body);
    if (threats.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos sospechosos detectados',
        threats
      });
    }

    next();
  }

  /**
   * Middleware para validar generación de prueba
   */
  static validateProofGeneration(req, res, next) {
    const validation = Validator.validateProofGeneration(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Datos para generación de prueba inválidos',
        details: validation.errors
      });
    }

    next();
  }

  /**
   * Middleware para validar verificación de prueba
   */
  static validateProofVerification(req, res, next) {
    const validation = Validator.validateProofVerification(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Datos para verificación de prueba inválidos',
        details: validation.errors
      });
    }

    next();
  }

  /**
   * Middleware para sanitizar inputs
   */
  static sanitizeInputs(req, res, next) {
    // Sanitizar strings en body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = Validator.sanitizeString(req.body[key]);
        }
      });
    }

    // Sanitizar query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = Validator.sanitizeString(req.query[key]);
        }
      });
    }

    next();
  }

  /**
   * Middleware para detectar amenazas de seguridad
   */
  static detectThreats(req, res, next) {
    const threats = Validator.detectAttackPatterns({
      body: req.body,
      query: req.query,
      headers: req.headers
    });

    if (threats.length > 0) {
      // Log de seguridad
      const logger = require('./logger');
      logger.security('Threat detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        threats,
        body: req.body,
        query: req.query
      });

      return res.status(400).json({
        success: false,
        error: 'Request blocked by security filters'
      });
    }

    next();
  }
}

module.exports = {
  Validator,
  ValidationMiddleware
};