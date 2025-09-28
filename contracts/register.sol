// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UserRegistry
 * @dev Contrato para registrar usuarios usando Zero-Knowledge Proofs
 * 
 * Este contrato maneja:
 * - Registro de usuarios con hash commitments
 * - Verificación de estado de registro
 * - Manejo de eventos de registro
 * - Seguridad básica contra ataques
 * 
 * Diseñado para ser usado con pruebas ZK generadas por Circom
 * Implementación simple sin dependencias externas para facilitar el despliegue
 */

contract UserRegistry {
    
    // ================================
    // VARIABLES DE CONTROL
    // ================================
    
    address public owner;
    bool public paused = false;
    mapping(address => bool) private _isEntering; // Para ReentrancyGuard
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier nonReentrant() {
        require(!_isEntering[msg.sender], "ReentrancyGuard: reentrant call");
        _isEntering[msg.sender] = true;
        _;
        _isEntering[msg.sender] = false;
    }
    
    // ================================
    // ESTRUCTURAS Y VARIABLES DE ESTADO
    // ================================
    
    /**
     * @dev Estructura para almacenar información del usuario
     */
    struct UserInfo {
        bool isRegistered;          // Si el usuario está registrado
        uint256 hashCommitment;     // Hash commitment de la contraseña (de ZK proof)
        uint256 registrationTime;   // Timestamp de registro
        uint256 lastLoginTime;      // Último login exitoso
        uint256 loginCount;         // Contador de logins
        bool isActive;              // Si la cuenta está activa
    }
    
    // Mapeo de dirección de usuario a su información
    mapping(address => UserInfo) public users;
    
    // Mapeo para evitar reutilización de hash commitments
    mapping(uint256 => bool) public usedCommitments;
    
    // Lista de usuarios registrados (para estadísticas)
    address[] public registeredUsers;
    
    // Configuración del contrato
    uint256 public maxUsers = 10000;        // Máximo número de usuarios
    uint256 public registrationFee = 0;     // Fee en wei (0 para testnet)
    bool public registrationOpen = true;    // Si el registro está abierto
    
    // ================================
    // EVENTOS
    // ================================
    
    /**
     * @dev Emitido cuando un usuario se registra exitosamente
     */
    event UserRegistered(
        address indexed user,
        uint256 hashCommitment,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido cuando un usuario hace login exitoso
     */
    event UserLogin(
        address indexed user,
        uint256 timestamp,
        uint256 loginCount
    );
    
    /**
     * @dev Emitido cuando se actualiza la configuración
     */
    event ConfigurationUpdated(
        uint256 maxUsers,
        uint256 registrationFee,
        bool registrationOpen
    );
    
    /**
     * @dev Emitido cuando se pausa/despausa el contrato
     */
    event ContractPaused(bool isPaused);
    
    // ================================
    // MODIFICADORES PERSONALIZADOS
    // ================================
    
    /**
     * @dev Verifica que el registro esté abierto
     */
    modifier registrationIsOpen() {
        require(registrationOpen, "Registration is currently closed");
        _;
    }
    
    /**
     * @dev Verifica que no se exceda el máximo de usuarios
     */
    modifier withinUserLimit() {
        require(registeredUsers.length < maxUsers, "Maximum user limit reached");
        _;
    }
    
    /**
     * @dev Verifica que el usuario no esté ya registrado
     */
    modifier notAlreadyRegistered(address user) {
        require(!users[user].isRegistered, "User already registered");
        _;
    }
    
    /**
     * @dev Verifica que el usuario esté registrado
     */
    modifier onlyRegisteredUsers(address user) {
        require(users[user].isRegistered, "User not registered");
        _;
    }
    
    // ================================
    // CONSTRUCTOR
    // ================================
    
    /**
     * @dev Constructor del contrato
     * @param _maxUsers Máximo número de usuarios permitidos
     * @param _registrationFee Fee de registro en wei
     */
    constructor(
        uint256 _maxUsers,
        uint256 _registrationFee
    ) {
        owner = msg.sender;
        maxUsers = _maxUsers;
        registrationFee = _registrationFee;
        
        emit ConfigurationUpdated(_maxUsers, _registrationFee, true);
    }
    
    // ================================
    // FUNCIONES PRINCIPALES
    // ================================
    
    /**
     * @dev Registrar un nuevo usuario con hash commitment
     * @param user Dirección del usuario a registrar
     * @param hashCommitment Hash commitment de la prueba ZK
     */
    function registerUser(
        address user,
        uint256 hashCommitment
    ) 
        external 
        payable
        nonReentrant
        whenNotPaused
        registrationIsOpen
        withinUserLimit
        notAlreadyRegistered(user)
    {
        // Validaciones
        require(user != address(0), "Invalid user address");
        require(hashCommitment != 0, "Invalid hash commitment");
        require(!usedCommitments[hashCommitment], "Hash commitment already used");
        require(msg.value >= registrationFee, "Insufficient registration fee");
        
        // Registrar usuario
        users[user] = UserInfo({
            isRegistered: true,
            hashCommitment: hashCommitment,
            registrationTime: block.timestamp,
            lastLoginTime: 0,
            loginCount: 0,
            isActive: true
        });
        
        // Marcar commitment como usado
        usedCommitments[hashCommitment] = true;
        
        // Añadir a lista de usuarios registrados
        registeredUsers.push(user);
        
        // Devolver exceso de pago si existe
        if (msg.value > registrationFee) {
            payable(msg.sender).transfer(msg.value - registrationFee);
        }
        
        emit UserRegistered(user, hashCommitment, block.timestamp);
    }
    
    /**
     * @dev Registrar login exitoso de usuario
     * @param user Dirección del usuario
     */
    function recordLogin(address user) 
        external 
        onlyRegisteredUsers(user) 
        whenNotPaused 
    {
        require(users[user].isActive, "User account is inactive");
        
        users[user].lastLoginTime = block.timestamp;
        users[user].loginCount += 1;
        
        emit UserLogin(user, block.timestamp, users[user].loginCount);
    }
    
    // ================================
    // FUNCIONES DE CONSULTA
    // ================================
    
    /**
     * @dev Verificar si un usuario está registrado
     * @param user Dirección del usuario
     * @return bool True si está registrado
     */
    function isUserRegistered(address user) external view returns (bool) {
        return users[user].isRegistered;
    }
    
    /**
     * @dev Obtener información de un usuario
     * @param user Dirección del usuario
     * @return UserInfo Información del usuario
     */
    function getUserInfo(address user) external view returns (UserInfo memory) {
        return users[user];
    }
    
    /**
     * @dev Obtener hash commitment de un usuario
     * @param user Dirección del usuario
     * @return uint256 Hash commitment
     */
    function getUserCommitment(address user) external view returns (uint256) {
        require(users[user].isRegistered, "User not registered");
        return users[user].hashCommitment;
    }
    
    /**
     * @dev Obtener estadísticas del contrato
     * @return totalUsers Número total de usuarios registrados
     * @return activeUsers Número de usuarios activos
     * @return totalLogins Número total de logins
     */
    function getStats() external view returns (
        uint256 totalUsers,
        uint256 activeUsers,
        uint256 totalLogins
    ) {
        totalUsers = registeredUsers.length;
        
        uint256 _activeUsers = 0;
        uint256 _totalLogins = 0;
        
        for (uint256 i = 0; i < registeredUsers.length; i++) {
            address user = registeredUsers[i];
            if (users[user].isActive) {
                _activeUsers++;
            }
            _totalLogins += users[user].loginCount;
        }
        
        return (totalUsers, _activeUsers, _totalLogins);
    }
    
    /**
     * @dev Obtener usuarios registrados con paginación
     * @param offset Índice de inicio
     * @param limit Número máximo de usuarios a devolver
     * @return address[] Array de direcciones de usuarios
     */
    function getRegisteredUsers(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        require(offset < registeredUsers.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > registeredUsers.length) {
            end = registeredUsers.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = registeredUsers[i];
        }
        
        return result;
    }
    
    // ================================
    // FUNCIONES DE ADMINISTRACIÓN
    // ================================
    
    /**
     * @dev Actualizar configuración del contrato (solo owner)
     * @param _maxUsers Nuevo máximo de usuarios
     * @param _registrationFee Nuevo fee de registro
     * @param _registrationOpen Si el registro está abierto
     */
    function updateConfiguration(
        uint256 _maxUsers,
        uint256 _registrationFee,
        bool _registrationOpen
    ) external onlyOwner {
        require(_maxUsers >= registeredUsers.length, "Max users cannot be less than current users");
        
        maxUsers = _maxUsers;
        registrationFee = _registrationFee;
        registrationOpen = _registrationOpen;
        
        emit ConfigurationUpdated(_maxUsers, _registrationFee, _registrationOpen);
    }
    
    /**
     * @dev Pausar/despausar el contrato (solo owner)
     */
    function togglePause() external onlyOwner {
        paused = !paused;
        emit ContractPaused(paused);
    }
    
    /**
     * @dev Desactivar cuenta de usuario (solo owner)
     * @param user Dirección del usuario
     */
    function deactivateUser(address user) external onlyOwner onlyRegisteredUsers(user) {
        users[user].isActive = false;
    }
    
    /**
     * @dev Reactivar cuenta de usuario (solo owner)
     * @param user Dirección del usuario
     */
    function reactivateUser(address user) external onlyOwner onlyRegisteredUsers(user) {
        users[user].isActive = true;
    }
    
    /**
     * @dev Retirar fondos del contrato (solo owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner).transfer(balance);
    }
    
    // ================================
    // FUNCIONES DE EMERGENCIA
    // ================================
    
    /**
     * @dev Función de emergencia para pausar el contrato
     * Puede ser llamada por el owner en caso de detectar problemas
     */
    function emergencyPause() external onlyOwner {
        paused = true;
        registrationOpen = false;
        
        emit ContractPaused(true);
        emit ConfigurationUpdated(maxUsers, registrationFee, false);
    }
    
    /**
     * @dev Verificar salud del contrato
     * @return bool True si el contrato está funcionando correctamente
     */
    function healthCheck() external view returns (bool) {
        return !paused && registrationOpen && registeredUsers.length < maxUsers;
    }
    
    // ================================
    // FUNCIONES PARA COMPATIBILIDAD
    // ================================
    
    /**
     * @dev Recibir Ether (para fees de registro)
     */
    receive() external payable {
        // Permitir recibir Ether solo si es para fees
        require(msg.value >= registrationFee, "Insufficient payment");
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}