// Script temporal para verificar el estado de la base de datos
// Ejecutar con: node src/utils/checkDatabase.js

const mysql = require('mysql2/promise');

async function checkDatabase() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Ajustar si tienes contraseña
      database: 'gestion_citas_db'
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar estructura de la tabla users
    console.log('\n📋 Estructura de la tabla users:');
    const [columns] = await connection.execute('DESCRIBE users');
    
    const phoneColumn = columns.find(col => col.Field === 'phone');
    if (phoneColumn) {
      console.log('📞 Campo phone:', phoneColumn);
      console.log('   - Tipo:', phoneColumn.Type);
      console.log('   - Permite NULL:', phoneColumn.Null);
      console.log('   - Default:', phoneColumn.Default);
    } else {
      console.log('❌ Campo phone no encontrado');
    }

    // Verificar algunos registros de ejemplo
    console.log('\n👥 Usuarios con teléfono:');
    const [users] = await connection.execute(`
      SELECT id, firstName, lastName, phone, CHAR_LENGTH(phone) as phone_length 
      FROM users 
      WHERE phone IS NOT NULL 
      LIMIT 5
    `);
    
    users.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName}: "${user.phone}" (${user.phone_length} chars)`);
    });

    // Intentar insertar un teléfono de prueba
    console.log('\n🧪 Prueba de inserción de teléfono largo:');
    const testPhone = '+1 (555) 123-4567 ext. 999'; // 26 caracteres
    console.log(`   Probando: "${testPhone}" (${testPhone.length} caracteres)`);
    
    try {
      await connection.execute(`
        INSERT INTO users (id, email, password, firstName, lastName, phone, createdAt, updatedAt) 
        VALUES (UUID(), 'test@test.com', 'test', 'Test', 'User', ?, NOW(), NOW())
      `, [testPhone]);
      
      console.log('   ✅ Inserción exitosa - El campo acepta teléfonos largos');
      
      // Limpiar el registro de prueba
      await connection.execute(`DELETE FROM users WHERE email = 'test@test.com'`);
      
    } catch (error) {
      console.log('   ❌ Error en inserción:', error.message);
      if (error.message.includes('Data too long')) {
        console.log('   🔧 El campo phone aún está limitado a 20 caracteres');
        console.log('   📝 Necesitas ejecutar: ALTER TABLE users MODIFY COLUMN phone VARCHAR(50);');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase();
