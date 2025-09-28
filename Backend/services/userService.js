/**
 * Servicio para manejar datos de usuarios
 * Utiliza almacenamiento en archivo JSON para simplicidad
 * En producción se debería usar una base de datos real
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class UserService {
  constructor() {
    this.usersFile = path.join(__dirname, '../data/users.json');
    this.ensureUsersFileExists();
  }

  /**
   * Asegurar que el archivo de usuarios existe
   */
  ensureUsersFileExists() {
    try {
      if (!fs.existsSync(this.usersFile)) {
        fs.writeFileSync(this.usersFile, '[]', 'utf8');
      }
    } catch (error) {
      console.error('Error creating users file:', error);
    }
  }

  /**
   * Leer todos los usuarios
   */
  getUsers() {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  /**
   * Guardar usuarios
   */
  saveUsers(users) {
    try {
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  /**
   * Buscar usuario por dirección de wallet
   */
  findByAddress(address) {
    const users = this.getUsers();
    return users.find(user => user.address.toLowerCase() === address.toLowerCase());
  }

  /**
   * Buscar usuario por username
   */
  findByUsername(username) {
    const users = this.getUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  /**
   * Buscar usuario por email
   */
  findByEmail(email) {
    const users = this.getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Crear nuevo usuario
   */
  createUser(userData) {
    const users = this.getUsers();
    
    // Verificar duplicados
    if (this.findByAddress(userData.address)) {
      throw new Error('Usuario con esta dirección ya existe');
    }
    
    if (this.findByUsername(userData.username)) {
      throw new Error('Nombre de usuario ya está en uso');
    }
    
    if (this.findByEmail(userData.email)) {
      throw new Error('Email ya está registrado');
    }

    // Crear nuevo usuario
    const newUser = {
      id: crypto.randomUUID(),
      username: userData.username.trim(),
      email: userData.email.toLowerCase().trim(),
      address: userData.address.toLowerCase(),
      passwordHash: userData.passwordHash,
      chainId: userData.chainId || 80002,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    users.push(newUser);
    
    if (this.saveUsers(users)) {
      return newUser;
    } else {
      throw new Error('Error guardando usuario');
    }
  }

  /**
   * Actualizar último login
   */
  updateLastLogin(address) {
    const users = this.getUsers();
    const user = users.find(u => u.address.toLowerCase() === address.toLowerCase());
    
    if (user) {
      user.lastLogin = new Date().toISOString();
      this.saveUsers(users);
      return user;
    }
    
    return null;
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getStats() {
    const users = this.getUsers();
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      recentLogins: users.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastLogin > dayAgo;
      }).length
    };
  }
}

module.exports = UserService;