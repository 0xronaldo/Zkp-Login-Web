#!/bin/bash

# Script para desarrollo local - ZK Login Web
# Este script facilita el desarrollo local configurando todo lo necesario

echo "🚀 Configurando entorno de desarrollo ZK Login Web"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar dependencias del sistema
check_dependencies() {
    log_info "Verificando dependencias del sistema..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor instala Node.js 16+ desde https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Se requiere Node.js 16 o superior. Versión actual: $(node --version)"
        exit 1
    fi
    
    log_success "Node.js $(node --version) detectado"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi
    
    log_success "npm $(npm --version) detectado"
}

# Instalar dependencias del frontend
install_frontend_deps() {
    log_info "Instalando dependencias del frontend..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json no encontrado. Ejecuta este script desde la raíz del proyecto"
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        log_success "Dependencias del frontend instaladas"
    else
        log_error "Error instalando dependencias del frontend"
        exit 1
    fi
}

# Instalar dependencias del backend
install_backend_deps() {
    log_info "Instalando dependencias del backend..."
    
    if [ -d "Backend" ]; then
        cd Backend
        npm install
        
        if [ $? -eq 0 ]; then
            log_success "Dependencias del backend instaladas"
            cd ..
        else
            log_error "Error instalando dependencias del backend"
            cd ..
            exit 1
        fi
    else
        log_warning "Directorio Backend no encontrado, saltando..."
    fi
}

# Instalar herramientas ZK (opcional)
install_zk_tools() {
    log_info "Instalando herramientas ZK (opcional)..."
    
    # Verificar si circom está instalado globalmente
    if ! command -v circom &> /dev/null; then
        log_warning "circom no está instalado globalmente"
        log_info "Para instalar circom: npm install -g circom"
        log_info "O sigue las instrucciones en: https://docs.circom.io/getting-started/installation/"
    else
        log_success "circom $(circom --version) detectado"
    fi
    
    # Verificar si snarkjs está instalado globalmente
    if ! command -v snarkjs &> /dev/null; then
        log_warning "snarkjs no está instalado globalmente"
        log_info "Para instalar snarkjs: npm install -g snarkjs"
    else
        log_success "snarkjs detectado"
    fi
}

# Configurar variables de entorno
setup_env_files() {
    log_info "Configurando archivos de entorno..."
    
    # Frontend .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Archivo .env creado desde .env.example"
        else
            log_warning "No se encontró .env.example para el frontend"
        fi
    else
        log_info "Archivo .env ya existe"
    fi
    
    # Backend .env
    if [ -d "Backend" ]; then
        if [ ! -f "Backend/.env" ]; then
            if [ -f "Backend/.env.example" ]; then
                cp Backend/.env.example Backend/.env
                log_success "Archivo Backend/.env creado desde .env.example"
            else
                log_warning "No se encontró Backend/.env.example"
            fi
        else
            log_info "Archivo Backend/.env ya existe"
        fi
    fi
}

# Compilar circuitos (si es posible)
compile_circuits() {
    log_info "Intentando compilar circuitos ZK..."
    
    if [ -d "Backend" ] && [ -f "Backend/scripts/compile-circuits.js" ]; then
        cd Backend
        node scripts/compile-circuits.js
        
        if [ $? -eq 0 ]; then
            log_success "Circuitos compilados exitosamente"
        else
            log_warning "Error compilando circuitos, funcionará en modo mock"
        fi
        cd ..
    else
        log_warning "Script de compilación no encontrado, funcionará en modo mock"
    fi
}

# Verificar puertos disponibles
check_ports() {
    log_info "Verificando puertos disponibles..."
    
    # Verificar puerto 3000 (frontend)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Puerto 3000 ya está en uso"
    else
        log_success "Puerto 3000 disponible para el frontend"
    fi
    
    # Verificar puerto 5000 (backend)
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Puerto 5000 ya está en uso"
    else
        log_success "Puerto 5000 disponible para el backend"
    fi
}

# Mostrar resumen e instrucciones
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 Configuración completada!${NC}"
    echo "================================"
    echo ""
    echo -e "${BLUE}Para iniciar el desarrollo:${NC}"
    echo ""
    echo "1. Frontend (React):"
    echo "   npm start"
    echo "   Abrirá en: http://localhost:3000"
    echo ""
    echo "2. Backend (Express):"
    echo "   cd Backend"
    echo "   npm run dev"
    echo "   Corriendo en: http://localhost:5000"
    echo ""
    echo -e "${BLUE}Recursos útiles:${NC}"
    echo "• Health check backend: http://localhost:5000/health"
    echo "• Info del sistema: http://localhost:5000/info"
    echo "• Logs del backend: Backend/logs/"
    echo ""
    echo -e "${YELLOW}Notas:${NC}"
    echo "• La aplicación funcionará en modo MOCK si no hay circuitos compilados"
    echo "• Para Mumbai testnet, necesitarás MATIC de prueba"
    echo "• Revisa los archivos .env para configuración personalizada"
    echo ""
    echo -e "${GREEN}¡Happy coding! 🚀${NC}"
}

# Función principal
main() {
    echo ""
    check_dependencies
    install_frontend_deps
    install_backend_deps
    install_zk_tools
    setup_env_files
    compile_circuits
    check_ports
    show_summary
}

# Ejecutar función principal
main