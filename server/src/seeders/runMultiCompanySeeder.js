const mysql = require('mysql2/promise');
const multiCompanySeeder = require('./multiCompanySeeder');
require('dotenv').config();

// Configuración de base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sistemas',
  password: process.env.DB_PASSWORD || 'adn',
  database: process.env.DB_NAME || 'gestion_citas_db',
  port: parseInt(process.env.DB_PORT) || 3309
};

const runSeeder = async () => {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    console.log('📋 Configuración:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log('');
    
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conexión establecida');
    console.log('');

    // Ejecutar seeder
    const result = await multiCompanySeeder(connection);
    
    console.log('\n✅ Seeder ejecutado exitosamente');
    console.log('🎯 Resultado:', result.message);
    
  } catch (error) {
    console.error('❌ Error ejecutando seeder:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  runSeeder();
}

module.exports = runSeeder;
