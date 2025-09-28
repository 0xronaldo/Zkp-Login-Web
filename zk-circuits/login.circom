pragma circom 2.2.2;

/*
 * Circuito de Login con Zero-Knowledge Proof
 * 
 * Este circuito permite verificar que un usuario conoce su contraseña
 * sin revelarla. El circuito toma como entrada:
 * - Hash de la contraseña (privado)
 * - Salt (privado) 
 * - Timestamp (público)
 * 
 * Y produce como salida:
 * - Hash commitment (público)
 * - Validity flag (público)
 * 
 * Diseñado para ser simple pero funcional para demostración
 */

include "circomlib/circuits/sha256/sha256.circom";
include "circomlib/circuits/bitify.circom";

template LoginCircuit() {
    
    // ================================
    // PARÁMETROS DEL CIRCUITO
    // ================================
    
    // Entradas privadas (secret inputs)
    signal private input passwordHash[32];  // Hash SHA256 de la contraseña (32 bytes)
    signal private input salt[32];          // Salt para el hash (32 bytes)
    signal private input userSecret;        // Secreto adicional del usuario
    
    // Entradas públicas (public inputs)
    signal input timestamp;                 // Timestamp de la autenticación
    signal input challengeNonce;            // Nonce del desafío para prevenir replay
    
    // Salidas públicas (public outputs)
    signal output hashCommitment;           // Commitment hash (resultado público)
    signal output isValid;                  // Flag de validez (1 si válido, 0 si no)
    
    // ================================
    // COMPONENTES INTERNOS
    // ================================
    
    // Componentes para conversión de bits
    component passwordHashBits = Bits2Num(256);
    component saltBits = Bits2Num(256);
    component timestampBits = Num2Bits(64);
    
    // Componente SHA256 para generar el commitment
    component hasher = Sha256(512); // 256 bits password + 256 bits salt
    
    // ================================
    // LÓGICA PRINCIPAL DEL CIRCUITO
    // ================================
    
    // Convertir inputs a bits para el hasher
    var i;
    
    // Convertir passwordHash a bits (primeros 256 bits del input del hasher)
    for (i = 0; i < 32; i++) {
        // Cada byte del passwordHash se convierte a 8 bits
        component passwordByte = Num2Bits(8);
        passwordByte.in <== passwordHash[i];
        
        for (var j = 0; j < 8; j++) {
            hasher.in[i * 8 + j] <== passwordByte.out[j];
        }
    }
    
    // Convertir salt a bits (siguientes 256 bits del input del hasher)
    for (i = 0; i < 32; i++) {
        component saltByte = Num2Bits(8);
        saltByte.in <== salt[i];
        
        for (var j = 0; j < 8; j++) {
            hasher.in[256 + i * 8 + j] <== saltByte.out[j];
        }
    }
    
    // Generar el hash commitment combinando passwordHash + salt
    component commitmentBits = Bits2Num(256);
    for (i = 0; i < 256; i++) {
        commitmentBits.in[i] <== hasher.out[i];
    }
    
    hashCommitment <== commitmentBits.out;
    
    // ================================
    // VALIDACIONES DE SEGURIDAD
    // ================================
    
    // Validar que el timestamp esté dentro de un rango razonable
    // (por ejemplo, no más de 1 hora en el futuro o pasado)
    component timestampValidation = TimestampValidator();
    timestampValidation.timestamp <== timestamp;
    timestampValidation.currentTime <== challengeNonce; // Usar nonce como proxy del tiempo actual
    
    // Validar que el passwordHash no sea todo ceros (password vacío)
    component passwordNotZero = NonZeroValidator(32);
    for (i = 0; i < 32; i++) {
        passwordNotZero.in[i] <== passwordHash[i];
    }
    
    // Validar que el salt no sea todo ceros
    component saltNotZero = NonZeroValidator(32);
    for (i = 0; i < 32; i++) {
        saltNotZero.in[i] <== salt[i];
    }
    
    // Validar que el userSecret esté en un rango válido
    component secretValidation = RangeValidator();
    secretValidation.value <== userSecret;
    secretValidation.min <== 1000;        // Mínimo valor del secreto
    secretValidation.max <== 999999999;   // Máximo valor del secreto
    
    // Combinar todas las validaciones
    component validationAnd = MultiAND(4);
    validationAnd.in[0] <== timestampValidation.isValid;
    validationAnd.in[1] <== passwordNotZero.isNotZero;
    validationAnd.in[2] <== saltNotZero.isNotZero;
    validationAnd.in[3] <== secretValidation.isValid;
    
    isValid <== validationAnd.out;
    
    // ================================
    // CONSTRAINT ADICIONAL DE SEGURIDAD
    // ================================
    
    // Asegurar que el commitment sea válido solo si todas las validaciones pasan
    component commitmentGate = Mux1();
    commitmentGate.c[0] <== 0;  // Si no es válido, commitment = 0
    commitmentGate.c[1] <== hashCommitment;  // Si es válido, usar el commitment real
    commitmentGate.s <== isValid;
    
    // Output final (solo será no-cero si isValid = 1)
    hashCommitment <== commitmentGate.out;
}

// ================================
// TEMPLATES AUXILIARES
// ================================

/*
 * Validador de timestamp
 * Verifica que el timestamp esté dentro de un rango razonable
 */
template TimestampValidator() {
    signal input timestamp;
    signal input currentTime;
    signal output isValid;
    
    // Calcular diferencia absoluta (simplificado)
    component diff = AbsDifference();
    diff.a <== timestamp;
    diff.b <== currentTime;
    
    // Validar que la diferencia sea menor a 3600 (1 hora en segundos)
    component rangeCheck = LessThan(32);
    rangeCheck.in[0] <== diff.out;
    rangeCheck.in[1] <== 3600;
    
    isValid <== rangeCheck.out;
}

/*
 * Validador de que un array no sea todo ceros
 */
template NonZeroValidator(n) {
    signal input in[n];
    signal output isNotZero;
    
    component sum = Sum(n);
    for (var i = 0; i < n; i++) {
        sum.in[i] <== in[i];
    }
    
    component isZero = IsZero();
    isZero.in <== sum.out;
    
    // isNotZero = !isZero
    isNotZero <== 1 - isZero.out;
}

/*
 * Validador de rango
 */
template RangeValidator() {
    signal input value;
    signal input min;
    signal input max;
    signal output isValid;
    
    component geq = GreaterEqThan(32);
    geq.in[0] <== value;
    geq.in[1] <== min;
    
    component leq = LessEqThan(32);
    leq.in[0] <== value;
    leq.in[1] <== max;
    
    component and = AND();
    and.a <== geq.out;
    and.b <== leq.out;
    
    isValid <== and.out;
}

/*
 * Diferencia absoluta entre dos números
 */
template AbsDifference() {
    signal input a;
    signal input b;
    signal output out;
    
    component lt = LessThan(32);
    lt.in[0] <== a;
    lt.in[1] <== b;
    
    component mux = Mux1();
    mux.c[0] <== a - b;  // Si a >= b
    mux.c[1] <== b - a;  // Si a < b
    mux.s <== lt.out;
    
    out <== mux.out;
}

/*
 * Suma de un array de números
 */
template Sum(n) {
    signal input in[n];
    signal output out;
    
    if (n == 1) {
        out <== in[0];
    } else {
        component sum1 = Sum(n-1);
        for (var i = 0; i < n-1; i++) {
            sum1.in[i] <== in[i];
        }
        out <== sum1.out + in[n-1];
    }
}

/*
 * AND múltiple
 */
template MultiAND(n) {
    signal input in[n];
    signal output out;
    
    if (n == 1) {
        out <== in[0];
    } else if (n == 2) {
        component and2 = AND();
        and2.a <== in[0];
        and2.b <== in[1];
        out <== and2.out;
    } else {
        component andPrev = MultiAND(n-1);
        for (var i = 0; i < n-1; i++) {
            andPrev.in[i] <== in[i];
        }
        component andLast = AND();
        andLast.a <== andPrev.out;
        andLast.b <== in[n-1];
        out <== andLast.out;
    }
}

// ================================
// INSTANCIA PRINCIPAL DEL CIRCUITO
// ================================

component main = LoginCircuit();

/*
 * NOTAS DE IMPLEMENTACIÓN:
 * 
 * 1. Este circuito es una demostración simplificada. En producción:
 *    - Usar bibliotecas de hash más robustas
 *    - Implementar validaciones más sofisticadas
 *    - Considerar ataques de timing y side-channel
 * 
 * 2. Para compilar este circuito:
 *    - Instalar circom: npm install -g circom
 *    - Compilar: circom login.circom --r1cs --wasm --sym
 *    - Generar trusted setup con snarkjs
 * 
 * 3. El circuito está diseñado para ser educativo y funcional,
 *    pero necesitaría auditoria de seguridad para uso en producción.
 * 
 * 4. Las dependencias circomlib pueden instalarse con:
 *    npm install circomlib
 */