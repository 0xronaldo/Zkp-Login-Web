// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ZKProofVerifier
 * @dev Contrato para verificar pruebas Zero-Knowledge generadas por Circom
 * 
 * Este contrato maneja:
 * - Verificación de pruebas ZK usando Groth16
 * - Registro de verificaciones exitosas
 * - Integración con el contrato de registro
 * - Prevención de replay attacks
 * 
 * IMPORTANTE: En producción, este contrato sería generado automáticamente
 * por Circom con la verification key específica del circuito
 */

interface IUserRegistry {
    function isUserRegistered(address user) external view returns (bool);
    function recordLogin(address user) external;
}

contract ZKProofVerifier {
    
    // ================================
    // VARIABLES DE ESTADO
    // ================================
    
    address public owner;
    IUserRegistry public userRegistry;
    bool public paused = false;
    
    // Estructura para almacenar verificaciones
    struct Verification {
        address user;
        uint256 timestamp;
        uint256 publicSignal;
        bool isValid;
    }
    
    // Mapeo de hash de prueba a verificación (prevenir replay)
    mapping(bytes32 => bool) public usedProofs;
    
    // Historial de verificaciones
    mapping(address => Verification[]) public userVerifications;
    
    // Contadores
    uint256 public totalVerifications;
    uint256 public successfulVerifications;
    
    // ================================
    // EVENTOS
    // ================================
    
    event ProofVerified(
        address indexed user,
        bool isValid,
        uint256 timestamp,
        bytes32 proofHash
    );
    
    event VerifierConfigured(
        address indexed userRegistry,
        address indexed owner
    );
    
    event ContractPaused(bool isPaused);
    
    // ================================
    // MODIFICADORES
    // ================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier validUser(address user) {
        require(user != address(0), "Invalid user address");
        require(userRegistry.isUserRegistered(user), "User not registered");
        _;
    }
    
    // ================================
    // CONSTRUCTOR
    // ================================
    
    constructor(address _userRegistry) {
        owner = msg.sender;
        userRegistry = IUserRegistry(_userRegistry);
        
        emit VerifierConfigured(_userRegistry, msg.sender);
    }
    
    // ================================
    // FUNCIONES PRINCIPALES DE VERIFICACIÓN
    // ================================
    
    /**
     * @dev Verificar una prueba ZK Groth16
     * 
     * NOTA: En un entorno real, esta función sería generada automáticamente
     * por Circom con la verification key específica. Por ahora implementamos
     * una verificación simplificada para demostración.
     * 
     * @param a Punto A de la prueba Groth16
     * @param b Punto B de la prueba Groth16  
     * @param c Punto C de la prueba Groth16
     * @param publicSignals Señales públicas de la prueba
     * @return bool True si la prueba es válida
     */
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory publicSignals
    ) public pure returns (bool) {
        
        // VERIFICACIÓN SIMPLIFICADA PARA DESARROLLO
        // En producción, aquí iría la verificación real de Groth16
        
        // Verificaciones básicas de estructura
        if (publicSignals.length == 0) return false;
        if (a[0] == 0 && a[1] == 0) return false;
        if (c[0] == 0 && c[1] == 0) return false;
        
        // Simulación de verificación de prueba válida
        // En un circuito real, esto verificaría matemáticamente la prueba
        return _simulateProofVerification(a, b, c, publicSignals);
    }
    
    /**
     * @dev Verificar prueba y registrar resultado para un usuario
     * @param user Dirección del usuario
     * @param a Punto A de la prueba
     * @param b Punto B de la prueba
     * @param c Punto C de la prueba
     * @param publicSignals Señales públicas
     * @return bool True si la verificación fue exitosa
     */
    function verifyAndRecord(
        address user,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory publicSignals
    ) 
        external 
        whenNotPaused 
        validUser(user) 
        returns (bool) 
    {
        // Generar hash único de la prueba para prevenir replay
        bytes32 proofHash = keccak256(abi.encodePacked(
            user,
            a[0], a[1],
            b[0][0], b[0][1], b[1][0], b[1][1],
            c[0], c[1],
            publicSignals,
            block.timestamp / 3600 // Válido por 1 hora
        ));
        
        // Verificar que la prueba no haya sido usada
        require(!usedProofs[proofHash], "Proof already used");
        
        // Verificar la prueba ZK
        bool isValid = verifyProof(a, b, c, publicSignals);
        
        // Registrar verificación
        _recordVerification(user, publicSignals[0], isValid, proofHash);
        
        // Si es válida, notificar al registry para actualizar login
        if (isValid) {
            try userRegistry.recordLogin(user) {} catch {
                // Continuar aunque falle el registro de login
            }
        }
        
        return isValid;
    }
    
    /**
     * @dev Verificación rápida solo para validación
     * @param user Dirección del usuario
     * @param publicSignals Señales públicas simplificadas
     * @return bool True si es válida
     */
    function quickVerify(
        address user,
        uint[] memory publicSignals
    ) external view validUser(user) returns (bool) {
        
        if (publicSignals.length == 0) return false;
        
        // Verificación simplificada para desarrollo
        // En producción esto validaría contra el commitment registrado
        return publicSignals[0] != 0;
    }
    
    // ================================
    // FUNCIONES INTERNAS
    // ================================
    
    /**
     * @dev Simulación de verificación de prueba para desarrollo
     */
    function _simulateProofVerification(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory publicSignals
    ) internal pure returns (bool) {
        
        // SIMULACIÓN PARA DESARROLLO
        // En producción, aquí iría la verificación matemática real de Groth16
        
        // Verificar que todos los puntos sean no-cero
        if (a[0] == 0 || a[1] == 0) return false;
        if (b[0][0] == 0 || b[0][1] == 0 || b[1][0] == 0 || b[1][1] == 0) return false;
        if (c[0] == 0 || c[1] == 0) return false;
        
        // Verificar señales públicas válidas
        if (publicSignals.length == 0 || publicSignals[0] == 0) return false;
        
        // Simulación: la prueba es válida si la primera señal pública
        // es diferente de 0 y los puntos están correctamente formateados
        uint256 checkSum = a[0] + b[0][0] + c[0] + publicSignals[0];
        
        // Simular algunos casos de falla para realismo
        if (checkSum % 100 == 0) return false; // 1% de fallos simulados
        
        return true;
    }
    
    /**
     * @dev Registrar resultado de verificación
     */
    function _recordVerification(
        address user,
        uint256 publicSignal,
        bool isValid,
        bytes32 proofHash
    ) internal {
        
        // Marcar prueba como usada
        usedProofs[proofHash] = true;
        
        // Crear registro de verificación
        Verification memory verification = Verification({
            user: user,
            timestamp: block.timestamp,
            publicSignal: publicSignal,
            isValid: isValid
        });
        
        // Almacenar en historial del usuario
        userVerifications[user].push(verification);
        
        // Actualizar contadores
        totalVerifications++;
        if (isValid) {
            successfulVerifications++;
        }
        
        // Emitir evento
        emit ProofVerified(user, isValid, block.timestamp, proofHash);
    }
    
    // ================================
    // FUNCIONES DE CONSULTA
    // ================================
    
    /**
     * @dev Obtener historial de verificaciones de un usuario
     * @param user Dirección del usuario
     * @return Verification[] Array de verificaciones
     */
    function getUserVerifications(address user) 
        external 
        view 
        returns (Verification[] memory) 
    {
        return userVerifications[user];
    }
    
    /**
     * @dev Obtener última verificación de un usuario
     * @param user Dirección del usuario
     * @return Verification Última verificación
     */
    function getLastVerification(address user) 
        external 
        view 
        returns (Verification memory) 
    {
        require(userVerifications[user].length > 0, "No verifications found");
        
        uint256 lastIndex = userVerifications[user].length - 1;
        return userVerifications[user][lastIndex];
    }
    
    /**
     * @dev Obtener estadísticas del verificador
     * @return total Total de verificaciones procesadas
     * @return successful Verificaciones exitosas
     * @return successRate Tasa de éxito (en porcentaje * 100)
     */
    function getStats() external view returns (
        uint256 total,
        uint256 successful,
        uint256 successRate
    ) {
        total = totalVerifications;
        successful = successfulVerifications;
        
        if (total > 0) {
            successRate = (successful * 10000) / total; // Porcentaje * 100
        } else {
            successRate = 0;
        }
        
        return (total, successful, successRate);
    }
    
    /**
     * @dev Verificar si una prueba ya fue usada
     * @param proofHash Hash de la prueba
     * @return bool True si ya fue usada
     */
    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }
    
    // ================================
    // FUNCIONES DE ADMINISTRACIÓN
    // ================================
    
    /**
     * @dev Actualizar dirección del registry de usuarios
     * @param _userRegistry Nueva dirección del registry
     */
    function updateUserRegistry(address _userRegistry) external onlyOwner {
        require(_userRegistry != address(0), "Invalid registry address");
        userRegistry = IUserRegistry(_userRegistry);
        
        emit VerifierConfigured(_userRegistry, owner);
    }
    
    /**
     * @dev Pausar/despausar el contrato
     */
    function togglePause() external onlyOwner {
        paused = !paused;
        emit ContractPaused(paused);
    }
    
    /**
     * @dev Limpiar pruebas usadas antiguas (para mantenimiento)
     * NOTA: Solo usar en casos extremos, puede afectar seguridad
     */
    function cleanupOldProofs(bytes32[] calldata proofHashes) external onlyOwner {
        for (uint256 i = 0; i < proofHashes.length; i++) {
            delete usedProofs[proofHashes[i]];
        }
    }
    
    /**
     * @dev Transferir ownership del contrato
     * @param newOwner Nueva dirección del owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
    
    // ================================
    // FUNCIONES DE UTILIDAD
    // ================================
    
    /**
     * @dev Verificar salud del contrato
     * @return bool True si está funcionando correctamente
     */
    function healthCheck() external view returns (bool) {
        return !paused && address(userRegistry) != address(0);
    }
    
    /**
     * @dev Obtener información del contrato
     * @return contractAddress Dirección de este contrato
     * @return registryAddress Dirección del registry de usuarios
     * @return ownerAddress Dirección del owner
     * @return isPaused Si está pausado
     */
    function getContractInfo() external view returns (
        address contractAddress,
        address registryAddress,
        address ownerAddress,
        bool isPaused
    ) {
        return (address(this), address(userRegistry), owner, paused);
    }
}