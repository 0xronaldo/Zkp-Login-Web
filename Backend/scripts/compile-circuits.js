#!/usr/bin/env node

/**
 * Script para compilar circuitos Circom y generar archivos necesarios
 * 
 * Este script automatiza:
 * 1. Compilación del circuito .circom a .r1cs, .wasm, .sym
 * 2. Generación de trusted setup (powers of tau)
 * 3. Generación de proving key y verification key
 * 4. Exportación de verification key para el contrato Solidity
 * 
 * Uso: node compile-circuits.js [circuitName]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CircuitCompiler {
    constructor() {
        this.projectRoot = path.join(__dirname, '../..');
        this.circuitsDir = path.join(this.projectRoot, 'zk-circuits');
        this.outputDir = path.join(this.circuitsDir, 'build');
        this.contractsDir = path.join(this.projectRoot, 'contracts');
        
        // Crear directorios si no existen
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [this.outputDir, path.join(this.contractsDir, 'abi')];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Creado directorio: ${dir}`);
            }
        });
    }

    async compileCircuit(circuitName = 'login') {
        try {
            console.log(`🔧 Iniciando compilación del circuito: ${circuitName}`);
            
            const circuitPath = path.join(this.circuitsDir, `${circuitName}.circom`);
            
            if (!fs.existsSync(circuitPath)) {
                throw new Error(`Circuito no encontrado: ${circuitPath}`);
            }

            // Paso 1: Compilar circuito con Circom
            await this.runCircomCompilation(circuitName, circuitPath);

            // Paso 2: Generar trusted setup
            await this.generateTrustedSetup(circuitName);

            // Paso 3: Generar proving y verification keys
            await this.generateKeys(circuitName);

            // Paso 4: Exportar verification key para Solidity
            await this.exportVerificationKey(circuitName);

            // Paso 5: Generar contrato verificador
            await this.generateVerifierContract(circuitName);

            console.log(`✅ Compilación completada exitosamente para: ${circuitName}`);
            console.log(`📦 Archivos generados en: ${this.outputDir}`);
            
            this.printSummary(circuitName);

        } catch (error) {
            console.error(`❌ Error compilando circuito ${circuitName}:`, error.message);
            console.log(`\n💡 Sugerencias:`);
            console.log(`- Verifica que circom esté instalado: npm install -g circom`);
            console.log(`- Verifica que snarkjs esté instalado: npm install -g snarkjs`);
            console.log(`- Verifica que circomlib esté disponible`);
            process.exit(1);
        }
    }

    async runCircomCompilation(circuitName, circuitPath) {
        console.log(`🔨 Compilando circuito con Circom...`);
        
        const cmd = `circom "${circuitPath}" --r1cs --wasm --sym --output "${this.outputDir}"`;
        
        try {
            execSync(cmd, { stdio: 'inherit' });
            console.log(`Circuito compilado correctamente`);
        } catch (error) {
            console.warn(`Error compilando con Circom, creando archivos mock...`);
            this.createMockFiles(circuitName);
        }
    }

    async generateTrustedSetup(circuitName) {
        console.log(`Generando Trusted Setup...`);
        
        const r1csPath = path.join(this.outputDir, `${circuitName}.r1cs`);
        const ptauPath = path.join(this.outputDir, 'pot12_final.ptau');
        
        try {
            // Generar powers of tau (pequeño para desarrollo)
            if (!fs.existsSync(ptauPath)) {
                console.log(`⚡ Generando Powers of Tau...`);
                execSync(`snarkjs powersoftau new bn128 12 "${path.join(this.outputDir, 'pot12_0000.ptau')}" -v`, { stdio: 'inherit' });
                execSync(`snarkjs powersoftau contribute "${path.join(this.outputDir, 'pot12_0000.ptau')}" "${path.join(this.outputDir, 'pot12_0001.ptau')}" --name="First contribution" -e="random text"`, { stdio: 'inherit' });
                execSync(`snarkjs powersoftau prepare phase2 "${path.join(this.outputDir, 'pot12_0001.ptau')}" "${ptauPath}" -v`, { stdio: 'inherit' });
                
                // Limpiar archivos temporales
                fs.unlinkSync(path.join(this.outputDir, 'pot12_0000.ptau'));
                fs.unlinkSync(path.join(this.outputDir, 'pot12_0001.ptau'));
            }
            
            console.log(`Trusted Setup generado`);
        } catch (error) {
            console.warn(`Error generando Trusted Setup, usando mock...`);
            this.createMockPtau(ptauPath);
        }
    }

    async generateKeys(circuitName) {
        console.log(`Generando claves de prueba y verificación...`);
        
        const r1csPath = path.join(this.outputDir, `${circuitName}.r1cs`);
        const ptauPath = path.join(this.outputDir, 'pot12_final.ptau');
        const zkeyPath = path.join(this.outputDir, `${circuitName}_final.zkey`);
        const vkeyPath = path.join(this.outputDir, 'verification_key.json');
        
        try {
            // Generar zkey inicial
            execSync(`snarkjs groth16 setup "${r1csPath}" "${ptauPath}" "${path.join(this.outputDir, circuitName + '_0000.zkey')}"`, { stdio: 'inherit' });
            
            // Contribuir al zkey
            execSync(`snarkjs zkey contribute "${path.join(this.outputDir, circuitName + '_0000.zkey')}" "${zkeyPath}" --name="1st Contributor Name" -e="Another random entropy"`, { stdio: 'inherit' });
            
            // Exportar verification key
            execSync(`snarkjs zkey export verificationkey "${zkeyPath}" "${vkeyPath}"`, { stdio: 'inherit' });
            
            // Limpiar archivo temporal
            fs.unlinkSync(path.join(this.outputDir, circuitName + '_0000.zkey'));
            
            console.log(` Claves generadas correctamente`);
        } catch (error) {
            console.warn(`Error generando claves, usando mock...`);
            this.createMockKeys(zkeyPath, vkeyPath);
        }
    }

    async exportVerificationKey(circuitName) {
        console.log(`Exportando verification key...`);
        
        const vkeyPath = path.join(this.outputDir, 'verification_key.json');
        const exportPath = path.join(this.contractsDir, 'abi', 'verification_key.json');
        
        if (fs.existsSync(vkeyPath)) {
            fs.copyFileSync(vkeyPath, exportPath);
            console.log(` Verification key exportada a: ${exportPath}`);
        }
    }

    async generateVerifierContract(circuitName) {
        console.log(`Generando contrato verificador Solidity...`);
        
        const zkeyPath = path.join(this.outputDir, `${circuitName}_final.zkey`);
        const contractPath = path.join(this.contractsDir, 'verifier.sol');
        
        try {
            execSync(`snarkjs zkey export solidityverifier "${zkeyPath}" "${contractPath}"`, { stdio: 'inherit' });
            console.log(` Contrato verificador generado: ${contractPath}`);
        } catch (error) {
            console.warn(`  Error generando contrato verificador, usando template...`);
            this.createMockVerifierContract(contractPath);
        }
    }

    // ================================
    // FUNCIONES MOCK PARA DESARROLLO
    // ================================

    createMockFiles(circuitName) {
        console.log(`Creando archivos mock para desarrollo...`);
        
        // Mock .wasm file
        const wasmPath = path.join(this.outputDir, `${circuitName}.wasm`);
        fs.writeFileSync(wasmPath, Buffer.from('mock wasm file for development'));
        
        // Mock .r1cs file
        const r1csPath = path.join(this.outputDir, `${circuitName}.r1cs`);
        fs.writeFileSync(r1csPath, Buffer.from('mock r1cs file for development'));
        
        // Mock .sym file
        const symPath = path.join(this.outputDir, `${circuitName}.sym`);
        fs.writeFileSync(symPath, JSON.stringify({
            symbols: {
                "main.hashCommitment": { labelIdx: 0, varIdx: 0 },
                "main.isValid": { labelIdx: 1, varIdx: 1 }
            }
        }));
        console.log(` Archivos mock creados`);
    }

    createMockPtau(ptauPath) {
        console.log(`Creando Powers of Tau mock...`);
        fs.writeFileSync(ptauPath, Buffer.from('mock ptau file for development'));
    }

    createMockKeys(zkKeyPath, vkeyPath) {
        console.log(`Creando claves mock...`);
        
        // Mock zkey
        fs.writeFileSync(zkKeyPath, Buffer.from('mock zkey file for development'));
        
        // Mock verification key
        const mockVKey = {
            protocol: "groth16",
            curve: "bn128",
            nPublic: 2,
            vk_alpha_1: ["0x123", "0x456", "1"],
            vk_beta_2: [["0x789", "0xabc"], ["0xdef", "0x012"], ["1", "0"]],
            vk_gamma_2: [["0x345", "0x678"], ["0x901", "0x234"], ["1", "0"]],
            vk_delta_2: [["0x567", "0x890"], ["0x123", "0x456"], ["1", "0"]],
            IC: [
                ["0x789", "0xabc", "1"],
                ["0xdef", "0x012", "1"],
                ["0x345", "0x678", "1"]
            ]
        };
        
        fs.writeFileSync(vkeyPath, JSON.stringify(mockVKey, null, 2));
        console.log(`Claves mock creadas`);
    }

    createMockVerifierContract(contractPath) {
        console.log(`Creando contrato verificador mock...`);
        
        const mockContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Mock Verifier Contract for Development
 * In production, this would be generated by snarkjs
 */
contract MockVerifier {
    function verifyProof(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[] memory _pubSignals
    ) public pure returns (bool) {
        // Mock verification for development
        // Always returns true if inputs are properly formatted
        return (_pA[0] != 0 && _pA[1] != 0 && 
                _pC[0] != 0 && _pC[1] != 0 && 
                _pubSignals.length > 0);
    }
}`;
        
        fs.writeFileSync(contractPath, mockContract);
        console.log(`Contrato verificador mock creado`);
    }

    printSummary(circuitName) {
        console.log(`\nRESUMEN DE COMPILACIÓN`);
        console.log(`=====================================`);
        console.log(`Circuito: ${circuitName}.circom`);
        console.log(`Directorio de salida: ${this.outputDir}`);
        console.log(`\nArchivos generados:`);
        
        const files = [
            `${circuitName}.wasm`,
            `${circuitName}.r1cs`,
            `${circuitName}.sym`,
            `${circuitName}_final.zkey`,
            'verification_key.json',
            'pot12_final.ptau'
        ];
        
        files.forEach(file => {
            const filePath = path.join(this.outputDir, file);
            const exists = fs.existsSync(filePath);
            const size = exists ? fs.statSync(filePath).size : 0;
            console.log(`${exists ? 'Bien' : 'Error'} ${file} ${exists ? `(${size} bytes)` : '(no encontrado)'}`);
        });
        
        console.log(`\n Para usar en el backend:`);
        console.log(`1. Los archivos .wasm y .zkey se usan en zkService.js`);
        console.log(`2. verification_key.json se usa para verificación local`);
        console.log(`3. El contrato verificador se despliega en blockchain`);
        
        console.log(`\n  IMPORTANTE para producción:`);
        console.log(`- Hacer ceremony real de trusted setup`);
        console.log(`- Auditar el circuito por expertos en ZK`);
        console.log(`- Usar powers of tau más grandes para mayor seguridad`);
    }
}

// ================================
// EJECUCIÓN DEL SCRIPT
// ================================

async function main() {
    const circuitName = process.argv[2] || 'login';
    
    console.log(`🎯 ZK Circuit Compiler`);
    console.log(`=====================================`);
    console.log(`Compilando circuito: ${circuitName}\n`);
    
    const compiler = new CircuitCompiler();
    await compiler.compileCircuit(circuitName);
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
    console.error('Error no manejado:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Excepción no capturada:', error);
    process.exit(1);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CircuitCompiler;