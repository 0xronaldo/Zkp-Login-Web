# 🔐 ZK Login Web - Zero-Knowledge Authentication System

Una aplicación web completa que demuestra autenticación segura usando **Zero-Knowledge Proofs (ZKP)**, blockchain (Polygon Mumbai), y pruebas criptográficas sin revelar datos sensibles.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.1.1-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-0.8.19-red.svg)

## 🎯 ¿Qué es ZK Login Web?

ZK Login Web es un **prototipo educativo** que demuestra cómo implementar un sistema de autenticación usando Zero-Knowledge Proofs. Los usuarios pueden registrarse y hacer login **sin que sus contraseñas sean almacenadas o transmitidas** en texto plano.

### ✨ Características Principales

- 🔒 **Zero-Knowledge Authentication**: Las contraseñas nunca salen del dispositivo del usuario
- **Optimizados para Amoy Testnet**
- 🌐 **Web3 Compatible**: Soporte para MetaMask y WalletConnect
- 🧮 **Circom Circuits**: Circuitos ZK personalizados para verificación
- 📱 **Responsive UI**: Interfaz simple y clara sin frameworks complejos
- 🛡️ **Security First**: Logging, validación y análisis de vulnerabilidades

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │     Backend      │    │     Blockchain      │
│   (React)       │◄──►│   (Express.js)   │◄──►│   (Polygon Mumbai)  │
│                 │    │                  │    │                     │
│ • Login UI      │    │ • ZK Proof Gen   │    │ • User Registry     │
│ • Wallet Conn   │    │ • Validation     │    │ • Proof Verifier    │
│ • ZK Generation │    │ • Blockchain API │    │ • Smart Contracts   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                        │
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   ZK Circuits   │    │   Privado.id     │    │      Auditoría      │
│   (Circom)      │    │   (Mock SDK)     │    │    & Seguridad      │
│                 │    │                  │    │                     │
│ • login.circom  │    │ • DID Generation │    │ • Logging System    │
│ • snarkjs       │    │ • Verification   │    │ • Threat Detection  │
│ • Trusted Setup │    │ • Credentials    │    │ • Vulnerability     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 16+ ([Descargar](https://nodejs.org/))
- **npm** o **yarn**
- **Git**
- **MetaMask** (navegador) para testing
- **MATIC tokens** para Amoy Testnet ([Faucet](https://faucet.polygon.technology/))

### 📦 Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/zkp-login-web.git
cd zkp-login-web/zkploginweb
```

2. **Instalar dependencias automáticamente:**
```bash
chmod +x setup-dev.sh
./setup-dev.sh
```

O manualmente:

```bash
# Frontend
npm install

# Backend
cd Backend
npm install
cd ..
```

3. **Configurar variables de entorno:**
```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp Backend/.env.example Backend/.env

# Editar con tus valores
nano .env
nano Backend/.env
```

### 🔧 Configuración

#### Variables Frontend (.env):
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_INFURA_ID=tu_infura_project_id
REACT_APP_DEFAULT_CHAIN_ID=80002
REACT_APP_DEBUG=true
```

#### Variables Backend (Backend/.env):
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
NETWORK_NAME=amoy
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### 🏃‍♂️ Ejecutar en Desarrollo

#### Opción 1: Ejecutar por separado
```bash
# Terminal 1: Frontend
npm start
# Abre http://localhost:3000

# Terminal 2: Backend
cd Backend
npm run dev
# Corre en http://localhost:5000
```

#### Opción 2: Ejecutar simultáneamente
```bash
npm run dev:full
```

### 🧪 Probar la Aplicación

1. **Abrir** http://localhost:3000
2. **Conectar wallet** (MetaMask en Amoy Testnet)
3. **Registrarse** con una contraseña
4. **Hacer login** con la misma contraseña
5. **Verificar** que funciona sin almacenar contraseñas

## 📚 Guía Completa de Uso

### 🔐 Proceso de Registro

1. **Conectar Wallet**: El usuario conecta MetaMask o WalletConnect
2. **Ingresar Contraseña**: Se ingresa una contraseña de al menos 6 caracteres
3. **Generar Prueba ZK**: Se crea una prueba que demuestra conocimiento de la contraseña sin revelarla
4. **Registro en Blockchain**: Se almacena un commitment (no la contraseña) en el contrato

### 🚪 Proceso de Login

1. **Conectar Wallet**: Misma wallet del registro
2. **Ingresar Contraseña**: La contraseña original
3. **Generar Prueba ZK**: Nueva prueba que demuestra conocimiento
4. **Verificar en Blockchain**: El contrato verifica la prueba sin ver la contraseña

### 🛠️ Desarrollo Avanzado

#### Compilar Circuitos ZK:
```bash
# Instalar herramientas ZK
npm install -g circom
npm install -g snarkjs

# Compilar circuito
npm run compile-circuits
```

#### Deploy de Contratos:
```bash
# Configurar wallet y RPC
export PRIVATE_KEY="tu_private_key"
export AMOY_RPC="https://rpc-amoy.polygon.technology"

# Deploy (requiere implementar script)
npm run deploy:contracts
```

## 📁 Estructura del Proyecto

```
zkploginweb/
├── 📁 src/                          # Frontend React
│   ├── 📁 components/
│   │   ├── 📁 Login/                # Componente principal de login
│   │   ├── 📁 Auth/                 # Conexión de wallets
│   │   └── 📁 ...
│   ├── 📁 services/
│   │   ├── 📄 zkProofService.js     # Generación de pruebas ZK
│   │   └── 📄 walletService.js      # Interacción con wallets
│   └── 📁 hooks/                    # React hooks personalizados
├── 📁 Backend/                      # Servidor Express.js
│   ├── 📄 index.js                  # Servidor principal
│   ├── 📁 services/
│   │   ├── 📄 zkService.js          # Lógica ZK backend
│   │   ├── 📄 blockchainService.js  # Interacción blockchain
│   │   └── 📄 privadoService.js     # Integración Privado.id
│   ├── 📁 utils/
│   │   ├── 📄 logger.js             # Sistema de logging
│   │   └── 📄 validator.js          # Validación y sanitización
│   └── 📁 scripts/
│       └── 📄 compile-circuits.js   # Compilación automática
├── 📁 contracts/                    # Contratos Solidity
│   ├── 📄 register.sol              # Registro de usuarios
│   └── 📄 proofverifier.sol         # Verificación de pruebas
├── 📁 zk-circuits/                  # Circuitos Circom
│   └── 📄 login.circom              # Circuito de autenticación
├── 📄 SECURITY.md                   # Análisis de seguridad
└── 📄 README.md                     # Este archivo
```

## 🧮 Circuitos Zero-Knowledge

### login.circom - Explicación Técnica

El circuito `login.circom` implementa la lógica de verificación:

```circom
// Entradas privadas (secretas)
signal private input passwordHash[32];  // Hash de la contraseña
signal private input salt[32];          // Salt único
signal private input userSecret;        // Secreto adicional

// Entradas públicas
signal input timestamp;                 // Timestamp de verificación
signal input challengeNonce;            // Nonce anti-replay

// Salidas públicas
signal output hashCommitment;           // Commitment verificable
signal output isValid;                  // Flag de validez
```

**¿Cómo funciona?**
1. El usuario ingresa su contraseña (solo en su dispositivo)
2. Se genera un hash SHA256 localmente
3. El circuito crea una prueba de que conoce la contraseña sin revelarla
4. La blockchain puede verificar la prueba sin ver la contraseña original

## 🔗 Integración Blockchain

### Contratos Inteligentes

#### UserRegistry.sol
- **Propósito**: Registrar usuarios con commitments ZK
- **Funciones principales**:
  - `registerUser()`: Registra un nuevo usuario
  - `isUserRegistered()`: Verifica si un usuario está registrado
  - `recordLogin()`: Registra un login exitoso

#### ZKProofVerifier.sol
- **Propósito**: Verificar pruebas Zero-Knowledge
- **Funciones principales**:
  - `verifyProof()`: Verifica una prueba Groth16
  - `verifyAndRecord()`: Verifica y registra el resultado

### Redes Soportadas

| Red | Chain ID | RPC | Propósito |
|-----|----------|-----|-----------|
| Amoy Testnet | 80002 | https://rpc-amoy.polygon.technology | Desarrollo y testing |
| Mumbai Testnet | 80001 | https://rpc-mumbai.matic.today | Deprecated (mantener compatibilidad) |
| Polygon Mainnet | 137 | https://polygon-rpc.com | Producción (futuro) |

## 🛡️ Seguridad

### Características de Seguridad Implementadas

- ✅ **Rate Limiting**: Protección contra ataques de fuerza bruta
- ✅ **Input Validation**: Sanitización y validación de todos los inputs
- ✅ **Threat Detection**: Detección de patrones de ataque comunes
- ✅ **Secure Logging**: Logging estructurado sin exponer datos sensibles
- ✅ **CORS Protection**: Configuración restrictiva de CORS
- ✅ **Replay Protection**: Prevención de reutilización de pruebas

### Vulnerabilidades Conocidas (Para Desarrollo)

⚠️ **IMPORTANTE**: Este es un prototipo educativo. Ver [SECURITY.md](./SECURITY.md) para análisis completo.

- **Trusted Setup**: Usar ceremony público en producción
- **Circuit Auditing**: Requiere auditoría formal de circuitos
- **Key Management**: Implementar HSM para claves de producción
- **Gas Optimization**: Optimizar contratos para costos menores

## 🔧 Herramientas de Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm start                    # Iniciar frontend
npm run dev:backend         # Iniciar backend
npm run dev:full           # Ambos simultáneamente

# Construcción
npm run build              # Build de producción
npm test                   # Ejecutar tests

# ZK & Blockchain
npm run compile-circuits   # Compilar circuitos Circom
npm run deploy:contracts   # Deploy contratos (TODO)

# Utilidades
./setup-dev.sh            # Setup automático de desarrollo
```

### Herramientas de Auditoría

```bash
# Análisis de contratos
npm install -g slither-analyzer
slither contracts/

# Análisis de dependencias
npx snyk test

# Linting de seguridad
npm install eslint-plugin-security
```

## 🚀 Despliegue en Producción

### ⚠️ Checklist Pre-Producción

- [ ] **Auditoría completa** de contratos por terceros
- [ ] **Ceremony público** para trusted setup
- [ ] **HSM o KMS** para manejo de claves
- [ ] **WAF y DDoS** protection
- [ ] **Monitoreo 24/7** y alertas
- [ ] **Bug bounty** program
- [ ] **Load testing** con datos reales
- [ ] **Backup** y disaster recovery
- [ ] **Compliance** y aspectos legales

### Infraestructura Recomendada

```yaml
# docker-compose.yml (ejemplo)
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
  
  backend:
    build: ./Backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
  
  redis:
    image: redis:alpine
    
  postgres:
    image: postgres:13
```

## 🤝 Contribuir

### Formas de Contribuir

1. **Reportar Bugs**: Usa GitHub Issues
2. **Sugerir Features**: Propón nuevas funcionalidades
3. **Mejorar Documentación**: PRs siempre bienvenidos
4. **Auditoría de Seguridad**: Ayuda a identificar vulnerabilidades
5. **Optimizaciones**: Performance y gas optimizations

### Guidelines de Desarrollo

```bash
# Fork y clone
git clone https://github.com/tu-usuario/zkp-login-web.git
cd zkp-login-web

# Crear branch para feature
git checkout -b feature/nueva-funcionalidad

# Desarrollo con linting
npm run lint
npm test

# Commit con conventional commits
git commit -m "feat: agregar nueva funcionalidad ZK"

# Push y crear PR
git push origin feature/nueva-funcionalidad
```

### Estilo de Código

- **JavaScript**: ESLint + Prettier
- **Solidity**: solhint
- **Circom**: Comentarios extensivos
- **Tests**: Jest + Mocha
- **Commits**: Conventional Commits

## 📖 Recursos Educativos

### 🎓 Para Aprender Zero-Knowledge

- [ZK Proofs Explained](https://blog.cryptographyengineering.com/2014/11/27/zero-knowledge-proofs-illustrated-primer/)
- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Tutorial](https://github.com/iden3/snarkjs)
- [ZK-SNARKs vs ZK-STARKs](https://consensys.net/blog/blockchain-explained/zero-knowledge-proofs-starks-vs-snarks/)

### 🔗 Para Blockchain Development

- [Ethereum Development](https://ethereum.org/en/developers/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [ethers.js Guide](https://docs.ethers.io/v6/)
- [Solidity Tutorial](https://docs.soliditylang.org/)

### 🛡️ Para Seguridad

- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ZK Security Guidelines](https://zkproof.org/security-guidelines/)

## 🐛 Problemas Comunes y Soluciones

### Frontend

**❌ Error: "Cannot connect to backend"**
```bash
# Verificar que el backend esté corriendo
cd Backend && npm run dev

# Verificar URL en .env
REACT_APP_BACKEND_URL=http://localhost:5000
```

**❌ Error: "MetaMask not detected"**
- Instalar MetaMask extension
- Refrescar la página
- Verificar que esté en Mumbai Testnet

### Backend

**❌ Error: "Circuit files not found"**
```bash
# Los archivos mock se crean automáticamente
# Para circuitos reales:
npm run compile-circuits
```

**❌ Error: "Blockchain connection failed"**
- Verificar RPC URL en .env
- Verificar network connectivity
- Usar Amoy testnet: https://rpc-amoy.polygon.technology

### Circuitos ZK

**❌ Error: "Trusted setup failed"**
```bash
# Instalar circom y snarkjs globalmente
npm install -g circom
npm install -g snarkjs

# Ejecutar script de compilación
cd Backend && node scripts/compile-circuits.js
```

## 📞 Soporte y Comunidad

### 🆘 Obtener Ayuda

- **GitHub Issues**: Para bugs y feature requests
- **Discussions**: Para preguntas generales
- **Email**: zklogin@example.com (placeholder)
- **Discord**: Únete a nuestro servidor (placeholder)

### 🌟 Agradecimientos

- **Circom Team**: Por las herramientas ZK
- **Polygon**: Por la infraestructura blockchain
- **OpenZeppelin**: Por contratos seguros
- **React Team**: Por el framework frontend
- **Comunidad ZK**: Por el conocimiento compartido

## 📄 Licencia

Este proyecto está licenciado bajo MIT License - ver [LICENSE](LICENSE) para detalles.

```
MIT License

Copyright (c) 2024 ZK Login Web Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🚀 Roadmap

### v1.0 (Actual - Prototipo)
- ✅ Autenticación ZK básica
- ✅ Integración blockchain
- ✅ UI/UX completa
- ✅ Documentación

### v1.1 (Próxima)
- [ ] Tests automatizados completos
- [ ] Optimización de gas
- [ ] Múltiples tipos de pruebas
- [ ] Dashboard de usuario

### v2.0 (Futuro)
- [ ] Mobile app (React Native)
- [ ] Múltiples blockchains
- [ ] Agregación de pruebas
- [ ] Layer 2 integration

### v3.0 (Visión)
- [ ] Decentralized identity
- [ ] Cross-chain compatibility
- [ ] Advanced privacy features
- [ ] Enterprise integration

---

## 🎉 ¡Comienza tu Viaje ZK!

```bash
git clone https://github.com/tu-usuario/zkp-login-web.git
cd zkp-login-web/zkploginweb
./setup-dev.sh
npm run dev:full
```

**¡Abre http://localhost:3000 y experimenta el futuro de la autenticación!** 🚀

---

*⚠️ Recuerda: Este es un prototipo educativo. Para uso en producción, requiere auditoría de seguridad profesional y configuración adicional.*

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
