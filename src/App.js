import React from 'react';
import Login from './components/Login/Login';
import "./App.css";

/**
 * Componente principal de la aplicación
 * 
 * Esta aplicación demuestra un sistema de autenticación usando:
 * - Zero-Knowledge Proofs (ZKproof)
 * - Blockchain (Polygon Mumbai)
 * - React + ethers.js
 * - Circom + snarkjs
 * 
 * El flujo es simple:
 * 1. Usuario conecta wallet (MetaMask/WalletConnect)
 * 2. Usuario se registra o hace login con contraseña
 * 3. Se genera una prueba ZK sin revelar la contraseña
 * 4. La prueba se verifica en un contrato inteligente
 */
function App() {
  return (
    <div className="App">
      {/* Componente principal de Login con ZK */}
      <Login />
    </div>
  );
}

export default App;
