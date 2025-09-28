# Archivos de Circuito ZK

Este directorio contiene los archivos compilados del circuito Circom:

- `login.wasm` - Código WebAssembly del circuito
- `login_final.zkey` - Proving key para generar pruebas
- `verification_key.json` - Verification key para verificar pruebas

## Para generar estos archivos:

1. Instalar dependencias:
```bash
npm install -g circom
npm install -g snarkjs
npm install circomlib
```

2. Ejecutar el script de compilación:
```bash
cd Backend
node scripts/compile-circuits.js
```

3. Copiar archivos generados a este directorio:
```bash
cp zk-circuits/build/login.wasm public/circuits/
cp zk-circuits/build/login_final.zkey public/circuits/
cp zk-circuits/build/verification_key.json public/circuits/
```

## Archivos Mock

Para desarrollo, se incluyen archivos mock que permiten que la aplicación funcione sin circuitos compilados reales.