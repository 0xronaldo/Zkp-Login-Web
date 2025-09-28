# 🏗️ Estructura Completa del Proyecto ZK Login Web

## 📁 Árbol de Directorios

```
zkploginweb/
├── 📄 README.md                          # Documentación principal
├── 📄 SECURITY.md                        # Análisis de seguridad
├── 📄 STRUCTURE.md                       # Este archivo - estructura del proyecto
├── 📄 package.json                       # Dependencias y scripts del frontend
├── 📄 .env                               # Variables de entorno (desarrollo)
├── 📄 .env.example                       # Plantilla de variables de entorno
├── 📄 setup-dev.sh                       # Script de configuración automática
│
├── 📁 public/                            # Archivos públicos del frontend
│   ├── 📄 index.html                     # HTML principal
│   ├── 📄 manifest.json                  # Manifiesto PWA
│   ├── 📄 robots.txt                     # Configuración de robots
│   └── 📁 circuits/                      # Archivos compilados de circuitos ZK
│       ├── 📄 README.md                  # Instrucciones de circuitos
│       ├── 📄 login.wasm                 # WebAssembly del circuito (generado)
│       ├── 📄 login_final.zkey           # Proving key (generado)
│       └── 📄 verification_key.json      # Verification key (generado)
│
├── 📁 src/                               # Código fuente del frontend React
│   ├── 📄 App.js                         # Componente principal de la app
│   ├── 📄 App.css                        # Estilos globales
│   ├── 📄 index.js                       # Punto de entrada de React
│   ├── 📄 index.css                      # Estilos base
│   ├── 📄 reportWebVitals.js             # Métricas de rendimiento
│   ├── 📄 setupTests.js                  # Configuración de tests
│   │
│   ├── 📁 components/                    # Componentes React
│   │   ├── 📁 Login/                     # Componente principal de login
│   │   │   ├── 📄 Login.jsx              # Lógica del login con ZK
│   │   │   └── 📄 Login.css              # Estilos del login
│   │   │
│   │   ├── 📁 Auth/                      # Componentes de autenticación
│   │   │   ├── 📄 WalletConnection.jsx   # Conexión con wallets (MetaMask, WC)
│   │   │   └── 📄 WalletConnection.css   # Estilos de conexión wallet
│   │   │
│   │   ├── 📁 DataRegistry/              # Componentes de registro de datos
│   │   ├── 📁 Registro/                  # Componentes de registro
│   │   ├── 📁 Acceso/                    # Componentes de acceso
│   │   ├── 📁 Verification/              # Componentes de verificación
│   │   └── 📁 verificador/               # Componentes verificadores
│   │
│   ├── 📁 hooks/                         # React Hooks personalizados
│   │   └── 📄 useWallet.js               # Hook para manejo de wallets Web3
│   │
│   ├── 📁 services/                      # Servicios y APIs
│   │   ├── 📄 walletService.js           # Servicio de interacción con wallets
│   │   └── 📄 zkProofService.js          # Servicio de generación de pruebas ZK
│   │
│   └── 📁 utils/                         # Utilidades del frontend
│
├── 📁 Backend/                           # Servidor Express.js
│   ├── 📄 package.json                   # Dependencias del backend
│   ├── 📄 .env                           # Variables de entorno del backend
│   ├── 📄 .env.example                   # Plantilla de variables backend
│   ├── 📄 index.js                       # Servidor principal Express
│   │
│   ├── 📁 services/                      # Servicios del backend
│   │   ├── 📄 zkService.js               # Manejo de pruebas ZK y Circom
│   │   ├── 📄 blockchainService.js       # Interacción con blockchain
│   │   └── 📄 privadoService.js          # Integración con Privado.id (mock)
│   │
│   ├── 📁 utils/                         # Utilidades del backend
│   │   ├── 📄 logger.js                  # Sistema de logging estructurado
│   │   └── 📄 validator.js               # Validación y sanitización
│   │
│   ├── 📁 scripts/                       # Scripts de automatización
│   │   └── 📄 compile-circuits.js        # Compilación automática de circuitos
│   │
│   └── 📁 logs/                          # Directorio de logs (generado)
│       ├── 📄 2024-XX-XX.log            # Logs diarios
│       └── 📄 security.log              # Logs de seguridad
│
├── 📁 contracts/                         # Contratos inteligentes Solidity
│   ├── 📄 register.sol                   # Contrato de registro de usuarios
│   ├── 📄 proofverifier.sol              # Contrato verificador de pruebas ZK
│   │
│   └── 📁 abi/                           # ABIs de contratos (generado)
│       ├── 📄 register.json              # ABI del contrato de registro
│       ├── 📄 proofverifier.json         # ABI del verificador
│       └── 📄 verification_key.json      # Verification key para contratos
│
└── 📁 zk-circuits/                       # Circuitos Zero-Knowledge
    ├── 📄 login.circom                   # Circuito principal de autenticación
    │
    └── 📁 build/                         # Archivos compilados (generado)
        ├── 📄 login.wasm                 # WebAssembly del circuito
        ├── 📄 login.r1cs                 # Constraint system
        ├── 📄 login.sym                  # Symbols file
        ├── 📄 login_final.zkey           # Proving key final
        ├── 📄 verification_key.json      # Verification key
        └── 📄 pot12_final.ptau           # Powers of tau (trusted setup)
```

## 🔍 Descripción Detallada de Componentes

### 🎨 Frontend (React)

#### **Componentes Principales:**

**`src/App.js`**
- Componente raíz de la aplicación
- Maneja el routing y estado global
- Integra el componente Login principal

**`src/components/Login/Login.jsx`**
- **Funcionalidad**: Interfaz principal de autenticación
- **Características**:
  - Formulario de login/registro
  - Integración con wallets Web3
  - Generación de pruebas ZK en el cliente
  - Manejo de estados de carga y errores
  - Mensajes informativos y de debug

**`src/components/Auth/WalletConnection.jsx`**
- **Funcionalidad**: Conexión con wallets de criptomonedas
- **Características**:
  - Soporte para MetaMask y WalletConnect
  - Cambio de redes (Mumbai, Polygon, etc.)
  - Visualización de balance y dirección
  - Manejo de desconexión y reconexión

#### **Hooks Personalizados:**

**`src/hooks/useWallet.js`**
- Hook para manejo completo de wallets
- Abstrae la complejidad de Web3
- Maneja eventos de cambio de cuenta/red
- Proporciona funciones de firma y transacciones

#### **Servicios:**

**`src/services/zkProofService.js`**
- **Propósito**: Generación de pruebas ZK en el frontend
- **Funciones clave**:
  - `generateLoginProof()`: Genera prueba para login
  - `verifyProofLocally()`: Verificación local opcional
  - `prepareCircuitInput()`: Prepara datos para el circuito
- **Características**:
  - Carga archivos .wasm y .zkey dinámicamente
  - Fallback a pruebas mock para desarrollo
  - Validación de inputs antes de generar pruebas

**`src/services/walletService.js`**
- **Propósito**: Interacción con wallets Web3
- **Funciones clave**:
  - `connectWallet()`: Conexión con diferentes wallets
  - `switchNetwork()`: Cambio de red blockchain
  - `signMessage()`: Firma de mensajes
  - `sendTransaction()`: Envío de transacciones
- **Características**:
  - Soporte multi-wallet
  - Manejo de eventos de wallet
  - Rate limiting de requests

### 🖥️ Backend (Express.js)

#### **Servidor Principal:**

**`Backend/index.js`**
- **Funcionalidad**: Servidor Express con endpoints REST
- **Endpoints principales**:
  - `POST /register-user`: Registro de usuarios
  - `POST /generate-proof`: Generación de pruebas ZK
  - `POST /verify-proof`: Verificación de pruebas
  - `POST /check-user`: Verificación de registro
  - `GET /health`: Health check del sistema
  - `GET /info`: Información del sistema
- **Middlewares**:
  - Rate limiting avanzado
  - Validación y sanitización
  - Logging estructurado
  - Detección de amenazas

#### **Servicios del Backend:**

**`Backend/services/zkService.js`**
- **Propósito**: Lógica ZK en el servidor
- **Funciones principales**:
  - `generateRegistrationProof()`: Pruebas para registro
  - `generateLoginProof()`: Pruebas para login
  - `verifyProof()`: Verificación local de pruebas
  - `generateCircuitInput()`: Preparación de inputs
- **Características**:
  - Inicialización de circuitos Circom
  - Manejo de archivos .wasm y .zkey
  - Fallback a pruebas mock
  - Optimización de performance

**`Backend/services/blockchainService.js`**
- **Propósito**: Interacción con blockchain
- **Funciones principales**:
  - `isUserRegistered()`: Verificar registro
  - `registerUser()`: Registrar en blockchain
  - `verifyProof()`: Verificar prueba en contrato
  - `getContractInfo()`: Info de contratos
- **Características**:
  - Conexión a Polygon Mumbai
  - Manejo de transacciones
  - Estimación de gas
  - Fallback a mock para desarrollo

**`Backend/services/privadoService.js`**
- **Propósito**: Integración con Privado.id (simulada)
- **Funciones principales**:
  - `createUserDID()`: Crear DID de usuario
  - `verifyUserProof()`: Verificación adicional
  - `generateDID()`: Generación de identidades
- **Características**:
  - API REST mock
  - Credenciales verificables
  - DIDs compatibles con estándares

#### **Utilidades del Backend:**

**`Backend/utils/logger.js`**
- **Propósito**: Sistema de logging avanzado
- **Características**:
  - Múltiples niveles (ERROR, WARN, INFO, DEBUG, SECURITY)
  - Logging a archivo y consola
  - Rotación automática de logs
  - Logging de seguridad especializado
  - Middleware para Express
  - Cleanup automático de logs antiguos

**`Backend/utils/validator.js`**
- **Propósito**: Validación y sanitización
- **Funciones principales**:
  - `validateUserRegistration()`: Validar datos de registro
  - `validateProofVerification()`: Validar pruebas
  - `detectAttackPatterns()`: Detectar ataques
  - `sanitizeString()`: Sanitizar inputs
- **Características**:
  - Validación de direcciones Ethereum
  - Validación de estructuras de pruebas Groth16
  - Detección de SQL injection, XSS, etc.
  - Middlewares de Express integrados

### ⛓️ Blockchain (Solidity)

#### **Contratos Inteligentes:**

**`contracts/register.sol` (UserRegistry)**
- **Propósito**: Registro de usuarios en blockchain
- **Funciones principales**:
  - `registerUser()`: Registrar usuario con commitment
  - `isUserRegistered()`: Verificar registro
  - `recordLogin()`: Registrar login exitoso
  - `getUserInfo()`: Obtener info de usuario
- **Características**:
  - Manejo de hash commitments
  - Prevención de replay attacks
  - Administración de usuarios
  - Events para tracking
  - Pausa de emergencia

**`contracts/proofverifier.sol` (ZKProofVerifier)**
- **Propósito**: Verificación de pruebas Zero-Knowledge
- **Funciones principales**:
  - `verifyProof()`: Verificar prueba Groth16
  - `verifyAndRecord()`: Verificar y registrar
  - `quickVerify()`: Verificación rápida
- **Características**:
  - Verificación matemática de pruebas
  - Integración con UserRegistry
  - Historial de verificaciones
  - Prevención de reutilización de pruebas
  - Estadísticas de verificación

### 🧮 Circuitos ZK (Circom)

#### **Circuito Principal:**

**`zk-circuits/login.circom`**
- **Propósito**: Lógica de autenticación Zero-Knowledge
- **Inputs privados**:
  - `passwordHash[32]`: Hash SHA256 de contraseña
  - `salt[32]`: Salt único del usuario
  - `userSecret`: Secreto adicional del usuario
- **Inputs públicos**:
  - `timestamp`: Timestamp de la prueba
  - `challengeNonce`: Nonce anti-replay
- **Outputs públicos**:
  - `hashCommitment`: Commitment verificable
  - `isValid`: Flag de validez de la prueba
- **Características**:
  - Validaciones de seguridad integradas
  - Prevención de ataques de timing
  - Constraints para prevenir cheating
  - Optimizado para Groth16

#### **Templates Auxiliares:**
- `TimestampValidator`: Validación de timestamps
- `NonZeroValidator`: Verificar arrays no-cero
- `RangeValidator`: Validación de rangos
- `MultiAND`: Operaciones AND múltiples

## 🔄 Flujo de Datos

### Registro de Usuario:
```
1. Frontend: Usuario ingresa contraseña
2. Frontend: Genera hash SHA256 localmente
3. Frontend: Genera prueba ZK con zkProofService
4. Frontend: Envía prueba a backend /register-user
5. Backend: Valida prueba con zkService
6. Backend: Registra en blockchain con blockchainService
7. Blockchain: Almacena commitment en UserRegistry
8. Backend: Respuesta al frontend
9. Frontend: Muestra confirmación al usuario
```

### Login de Usuario:
```
1. Frontend: Usuario ingresa contraseña
2. Frontend: Genera nueva prueba ZK
3. Frontend: Envía prueba a backend /verify-proof
4. Backend: Verifica prueba localmente
5. Backend: Verifica en blockchain con ZKProofVerifier
6. Blockchain: Ejecuta verificación matemática
7. Backend: Registra login en UserRegistry
8. Backend: Respuesta con resultado
9. Frontend: Permite acceso o rechaza
```

## 🛠️ Configuración de Desarrollo

### Variables de Entorno Requeridas:

#### Frontend (.env):
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_INFURA_ID=tu_infura_project_id
REACT_APP_DEFAULT_CHAIN_ID=80001
REACT_APP_DEBUG=true
```

#### Backend (Backend/.env):
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
NETWORK_NAME=mumbai
MUMBAI_RPC_URL=https://rpc-mumbai.matic.today
SERVER_PRIVATE_KEY=tu_private_key_para_transacciones
REGISTER_CONTRACT_ADDRESS=direccion_contrato_registro
VERIFIER_CONTRACT_ADDRESS=direccion_contrato_verificador
```

### Scripts de Desarrollo:

```bash
# Setup inicial
./setup-dev.sh                    # Configuración automática completa

# Desarrollo frontend
npm start                          # Servidor de desarrollo React
npm run build                      # Build de producción
npm test                          # Tests del frontend

# Desarrollo backend
cd Backend && npm run dev         # Servidor Express con nodemon
cd Backend && npm start           # Servidor Express producción

# Desarrollo simultáneo
npm run dev:full                  # Frontend + Backend simultáneo

# Circuitos ZK
npm run compile-circuits          # Compilar circuitos Circom
cd Backend && node scripts/compile-circuits.js

# Contratos
npm run deploy:contracts          # Deploy contratos (TODO)
```

## 📊 Métricas y Monitoreo

### Logs Generados:
- **Backend/logs/YYYY-MM-DD.log**: Logs diarios generales
- **Backend/logs/security.log**: Eventos de seguridad
- **Console logs**: Información de desarrollo

### Métricas Clave:
- Tiempo de generación de pruebas ZK
- Tasa de éxito de verificaciones
- Latencia de requests HTTP
- Errores de conexión blockchain
- Rate limiting activations

## 🔒 Aspectos de Seguridad

### Implementaciones de Seguridad:
- **Rate Limiting**: Múltiples niveles de protección
- **Input Validation**: Sanitización completa
- **Threat Detection**: Patrones de ataque conocidos
- **Secure Logging**: Sin exposición de datos sensibles
- **CORS Protection**: Configuración restrictiva
- **Replay Protection**: Nonces y timestamps

### Análisis de Vulnerabilidades:
Ver [SECURITY.md](./SECURITY.md) para análisis completo de:
- Vulnerabilidades de contratos
- Vulnerabilidades del backend
- Vulnerabilidades del frontend
- Vulnerabilidades de circuitos ZK
- Recomendaciones de mitigación

## 🚀 Optimizaciones de Performance

### Frontend:
- **Code Splitting**: Carga bajo demanda
- **Service Workers**: Cache inteligente
- **Bundle Analysis**: Optimización de tamaño

### Backend:
- **Connection Pooling**: Reutilización de conexiones
- **Caching**: Redis para datos frecuentes
- **Compression**: Gzip para responses

### Blockchain:
- **Gas Optimization**: Contratos optimizados
- **Batch Operations**: Operaciones agrupadas
- **Layer 2**: Preparado para scaling solutions

---

Esta estructura proporciona una base sólida para un sistema de autenticación Zero-Knowledge escalable y seguro. Cada componente está diseñado para ser modular, testeable y mantenible.