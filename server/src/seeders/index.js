const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const LicenseSeeder = require('./LicenseSeeder');

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gestion_citas_db',
  charset: 'utf8mb4'
};

// Función de query simplificada
async function query(sql, params = []) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

// Función principal del seeder
async function runSeeders() {
  try {
    console.log('🌱 Iniciando proceso de seeders...');
    console.log('📊 Configuración de base de datos:');
    console.log(`   - Host: ${dbConfig.host}`);
    console.log(`   - Database: ${dbConfig.database}`);
    console.log(`   - User: ${dbConfig.user}`);
    console.log('');
    
    // Verificar conexión a la base de datos
    console.log('🔗 Verificando conexión a la base de datos...');
    await query('SELECT 1');
    console.log('✅ Conexión exitosa');
    console.log('');
    
    // Ejecutar LicenseSeeder
    console.log('📄 Ejecutando seeder de licencias...');
    const licenseSeeder = new LicenseSeeder(query);
    const result = await licenseSeeder.run();
    
    console.log('');
    console.log('🎉 Proceso de seeders completado exitosamente');
    console.log(`📊 Resultado: ${result.message}`);
    
    if (result.data && result.data.length > 0) {
      console.log('📋 Datos insertados:');
      result.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name || item.id}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error ejecutando seeders:', error);
    console.error('');
    console.error('🔍 Posibles causas:');
    console.error('   - La base de datos no está corriendo');
    console.error('   - Las credenciales son incorrectas');
    console.error('   - La tabla "licenses" no existe');
    console.error('   - Variables de entorno no configuradas');
    console.error('');
    console.error('✅ Soluciones:');
    console.error('   1. Verificar que XAMPP/MySQL esté corriendo');
    console.error('   2. Revisar el archivo .env');
    console.error('   3. Ejecutar primero: create_licenses_table.sql');
    
    process.exit(1);
  }
}

// Ejecutar seeders específicos
async function runSpecificSeeder(seederName) {
  try {
    console.log(`🌱 Ejecutando seeder específico: ${seederName}`);
    
    switch (seederName.toLowerCase()) {
      case 'licenses':
      case 'license':
        const licenseSeeder = new LicenseSeeder(query);
        const result = await licenseSeeder.run();
        console.log(`✅ ${result.message}`);
        break;
        
      default:
        console.error(`❌ Seeder "${seederName}" no encontrado`);
        console.log('📋 Seeders disponibles:');
        console.log('   - licenses (o license)');
        process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Error ejecutando seeder específico:', error);
    process.exit(1);
  }
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.length > 0) {
  // Ejecutar seeder específico
  runSpecificSeeder(args[0]);
} else {
  // Ejecutar todos los seeders
  runSeeders();
}

module.exports = {
  runSeeders,
  runSpecificSeeder,
  query
};
