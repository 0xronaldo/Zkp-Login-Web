/**
 * Sistema de logging para el backend ZK Login
 * 
 * Proporciona logging estructurado con diferentes niveles:
 * - error: Errores críticos que requieren atención inmediata
 * - warn: Advertencias que podrían indicar problemas
 * - info: Información general del sistema
 * - debug: Información detallada para debugging
 * - security: Eventos relacionados con seguridad
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      SECURITY: 4
    };
    
    this.currentLevel = this.levels[process.env.LOG_LEVEL?.toUpperCase()] || this.levels.INFO;
    this.enableConsole = process.env.NODE_ENV !== 'production';
    this.enableFile = true;
    
    this.ensureLogDirectory();
  }

  /**
   * Crear directorio de logs si no existe
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Formatear mensaje de log
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      pid: process.pid,
      ...metadata
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Escribir log a archivo
   */
  writeToFile(level, message, metadata = {}) {
    if (!this.enableFile) return;

    const formattedMessage = this.formatMessage(level, message, metadata);
    const fileName = `${new Date().toISOString().split('T')[0]}.log`;
    const filePath = path.join(this.logDir, fileName);

    fs.appendFileSync(filePath, formattedMessage + '\n');

    // Log de seguridad en archivo separado
    if (level === 'SECURITY') {
      const securityFile = path.join(this.logDir, 'security.log');
      fs.appendFileSync(securityFile, formattedMessage + '\n');
    }
  }

  /**
   * Mostrar log en consola
   */
  logToConsole(level, message, metadata = {}) {
    if (!this.enableConsole) return;

    const timestamp = new Date().toISOString();
    const colors = {
      ERROR: '\x1b[31m',    // Rojo
      WARN: '\x1b[33m',     // Amarillo
      INFO: '\x1b[36m',     // Cyan
      DEBUG: '\x1b[90m',    // Gris
      SECURITY: '\x1b[95m'  // Magenta
    };
    const reset = '\x1b[0m';

    const color = colors[level] || '';
    const metaString = Object.keys(metadata).length > 0 ? 
      ` ${JSON.stringify(metadata)}` : '';

    console.log(
      `${color}[${timestamp}] ${level}:${reset} ${message}${metaString}`
    );
  }

  /**
   * Log genérico
   */
  log(level, message, metadata = {}) {
    if (this.levels[level] > this.currentLevel) return;

    this.logToConsole(level, message, metadata);
    this.writeToFile(level, message, metadata);
  }

  /**
   * Log de error
   */
  error(message, error = null, metadata = {}) {
    const errorMeta = {
      ...metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };
    
    this.log('ERROR', message, errorMeta);
  }

  /**
   * Log de advertencia
   */
  warn(message, metadata = {}) {
    this.log('WARN', message, metadata);
  }

  /**
   * Log de información
   */
  info(message, metadata = {}) {
    this.log('INFO', message, metadata);
  }

  /**
   * Log de debug
   */
  debug(message, metadata = {}) {
    this.log('DEBUG', message, metadata);
  }

  /**
   * Log de seguridad
   */
  security(event, details = {}) {
    this.log('SECURITY', `Security Event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log de actividad de usuario
   */
  userActivity(action, userAddress, details = {}) {
    this.info(`User Activity: ${action}`, {
      action,
      userAddress,
      ...details
    });
  }

  /**
   * Log de transacciones blockchain
   */
  blockchain(action, details = {}) {
    this.info(`Blockchain: ${action}`, {
      action,
      network: details.network || 'unknown',
      ...details
    });
  }

  /**
   * Log de pruebas ZK
   */
  zkproof(action, details = {}) {
    this.info(`ZKProof: ${action}`, {
      action,
      ...details
    });
  }

  /**
   * Middleware de Express para logging de requests
   */
  requestMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Log de request entrante
      this.info('HTTP Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length')
      });

      // Interceptar response
      const originalSend = res.send;
      res.send = function(body) {
        const duration = Date.now() - start;
        
        // Log de response
        logger.info('HTTP Response', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          responseSize: body ? body.length : 0
        });

        // Log de seguridad para requests sospechosos
        if (res.statusCode >= 400) {
          logger.security('HTTP Error Response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }

  /**
   * Limpiar logs antiguos
   */
  cleanupOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    fs.readdir(this.logDir, (err, files) => {
      if (err) return;

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info('Log file cleaned up', { file });
        }
      });
    });
  }

  /**
   * Obtener estadísticas de logs
   */
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        oldestFile: null,
        newestFile: null
      };

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filePath);
        
        stats.totalSize += fileStats.size;
        
        if (!stats.oldestFile || fileStats.mtime < stats.oldestFile.mtime) {
          stats.oldestFile = { name: file, mtime: fileStats.mtime };
        }
        
        if (!stats.newestFile || fileStats.mtime > stats.newestFile.mtime) {
          stats.newestFile = { name: file, mtime: fileStats.mtime };
        }
      });

      return stats;
    } catch (error) {
      this.error('Error getting log stats', error);
      return null;
    }
  }
}

// Crear instancia singleton
const logger = new Logger();

// Limpiar logs antiguos al iniciar (solo en producción)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    logger.cleanupOldLogs(30); // Mantener logs por 30 días
  }, 24 * 60 * 60 * 1000); // Ejecutar cada 24 horas
}

module.exports = logger;