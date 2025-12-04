const mysql = require('mysql2/promise');

const testConnection = async () => {
  const configs = [
    // Configuración 1: Sin contraseña
    {
      host: 'localhost',
      user: 'sistemas',
      password: 'adn',
      database: 'gestion_citas_db',
      port: 3309
    },
    // Configuración 2: Con contraseña común
    {
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'gestion_citas_db',
      port: 3306
    },
    // Configuración 3: Puerto alternativo
    {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'gestion_citas_db',
      port: 3307
    }
  ];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`\n🧪 Probando configuración ${i + 1}:`);
    console.log(`   Host: ${config.host}`);
    console.log(`   Usuario: ${config.user}`);
    console.log(`   Password: ${config.password ? '***' : '(vacía)'}`);
    console.log(`   Base de datos: ${config.database}`);
    console.log(`   Puerto: ${config.port}`);

    try {
      const connection = await mysql.createConnection(config);
      console.log('✅ ¡Conexión exitosa!');
      
      // Probar una consulta simple
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`📊 Usuarios en la base de datos: ${rows[0].count}`);
      
      await connection.end();
      console.log('🔌 Conexión cerrada');
      
      console.log('\n🎉 ¡Configuración correcta encontrada!');
      console.log('Usa esta configuración en tu .env:');
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password}`);
      console.log(`DB_NAME=${config.database}`);
      console.log(`DB_PORT=${config.port}`);
      
      return config;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n💥 No se pudo conectar con ninguna configuración');
  console.log('Verifica que:');
  console.log('1. XAMPP esté ejecutándose');
  console.log('2. MySQL esté activo');
  console.log('3. La base de datos "gestion_citas_db" exista');
};

testConnection();
