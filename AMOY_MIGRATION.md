# 🔄 Migración a Polygon Amoy Testnet

## 📋 Cambios Realizados

El proyecto ha sido actualizado para usar **Polygon Amoy Testnet** como la red principal de desarrollo, reemplazando Mumbai Testnet que fue deprecada.

### ✅ **Cambios Implementados:**

#### **1. Configuración de Red Principal:**
- **Chain ID**: 80001 (Mumbai) → **80002 (Amoy)**
- **RPC URL**: `https://rpc-mumbai.matic.today` → `https://rpc-amoy.polygon.technology`
- **Explorer**: `https://mumbai.polygonscan.com` → `https://amoy.polygonscan.com`

#### **2. Variables de Entorno Actualizadas:**

**Frontend (.env):**
```env
# Antes
REACT_APP_DEFAULT_CHAIN_ID=80001
REACT_APP_MUMBAI_RPC_URL=https://rpc-mumbai.matic.today

# Ahora
REACT_APP_DEFAULT_CHAIN_ID=80002
REACT_APP_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

**Backend (.env):**
```env
# Antes
NETWORK_NAME=mumbai
MUMBAI_RPC_URL=https://rpc-mumbai.matic.today

# Ahora
NETWORK_NAME=amoy
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

#### **3. Archivos Actualizados:**

✅ **Frontend:**
- `src/components/Auth/WalletConnection.jsx` - Redes soportadas
- `src/components/Login/Login.jsx` - Referencias de red
- `src/hooks/useWallet.js` - Nombres de red
- `src/services/walletService.js` - Configuración de redes
- `.env` y `.env.example` - Variables de entorno

✅ **Backend:**
- `Backend/index.js` - Chain ID por defecto y redes
- `Backend/services/blockchainService.js` - Configuración de redes
- `Backend/services/privadoService.js` - Referencias DIDs
- `Backend/utils/validator.js` - Chain IDs válidos
- `Backend/.env` y `.env.example` - Variables de entorno

✅ **Documentación:**
- `README.md` - Todas las referencias actualizadas
- `STRUCTURE_DETAILED.md` - Información de arquitectura

### 🔗 **Información de Polygon Amoy:**

| Parámetro | Valor |
|-----------|-------|
| **Nombre** | Polygon Amoy Testnet |
| **Chain ID** | 80002 |
| **RPC URL** | https://rpc-amoy.polygon.technology |
| **Explorer** | https://amoy.polygonscan.com |
| **Faucet** | https://faucet.polygon.technology |
| **Moneda** | MATIC (testnet) |

### 🔄 **Compatibilidad Backwards:**

El proyecto mantiene soporte para Mumbai (Chain ID 80001) para compatibilidad, pero **Amoy es ahora la red por defecto**.

### 🛠️ **Para Desarrolladores:**

#### **Si ya tienes Mumbai configurado:**

1. **Actualizar MetaMask:**
   - Agregar red Amoy Testnet
   - Chain ID: `80002`
   - RPC: `https://rpc-amoy.polygon.technology`
   - Explorador: `https://amoy.polygonscan.com`

2. **Obtener MATIC de Testnet:**
   - Usar el faucet: https://faucet.polygon.technology
   - Seleccionar "Amoy Testnet"
   - Ingresar tu dirección de wallet

3. **Actualizar Variables de Entorno:**
   ```bash
   # Actualizar .env
   REACT_APP_DEFAULT_CHAIN_ID=80002
   
   # Actualizar Backend/.env
   NETWORK_NAME=amoy
   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   ```

#### **Primera vez configurando:**

Simplemente ejecuta el setup como normal:
```bash
./setup-dev.sh
npm run dev:full
```

### ⚠️ **Notas Importantes:**

1. **Mumbai Testnet está deprecated** - Polygon recomienda migrar a Amoy
2. **Los contratos deployados en Mumbai** seguirán funcionando, pero nuevos deploys deben ser en Amoy
3. **El faucet de Mumbai puede dejar de funcionar** en el futuro
4. **Amoy tiene mejor estabilidad** y soporte a largo plazo

### 🔧 **Troubleshooting:**

#### **Error: "Unsupported chain id: 80001"**
- Cambiar a Amoy Testnet (Chain ID 80002)
- Actualizar variables de entorno

#### **Error: "Cannot connect to RPC"**
- Verificar que usas la URL correcta: `https://rpc-amoy.polygon.technology`
- Revisar conectividad de red

#### **Error: "Insufficient MATIC balance"**
- Usar el faucet de Amoy: https://faucet.polygon.technology
- Seleccionar "Amoy Testnet" en el faucet

### 📚 **Referencias Adicionales:**

- [Polygon Amoy Testnet Documentation](https://docs.polygon.technology/tools/wallets/metamask/add-polygon-network/)
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Amoy Explorer](https://amoy.polygonscan.com/)
- [Migration Guide](https://polygon.technology/blog/introducing-the-amoy-testnet-for-polygon-pos)

---

**✅ ¡Tu proyecto está ahora configurado para usar Polygon Amoy Testnet!**

La migración está completa y el sistema funcionará automáticamente con la nueva red. Los usuarios existentes pueden seguir usando Mumbai temporalmente mientras migran a Amoy.