const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3309'),
  user: process.env.DB_USER || 'sistemas',
  password: process.env.DB_PASSWORD || 'sistemas',
  database: process.env.DB_NAME || 'gestion_citas_db'
};

async function cleanDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    console.log('📋 Configuración:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida\n');

    // Desactivar verificaciones de claves foráneas temporalmente
    console.log('🔓 Desactivando verificaciones de claves foráneas...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Lista de tablas en orden de dependencias (de más dependiente a menos dependiente)
    // NOTA: invoices y payments NO se limpian para permitir pruebas
    const tablesToClean = [
      'supply_movements',      // Movimientos de inventario (depende de supplies)
      'medical_history',       // Historial médico (depende de clients)
      'appointment_treatments', // Tratamientos de citas (depende de appointments y treatments)
      'appointments',          // Citas (depende de clients, employees, companies)
      'audit_logs',           // Logs de auditoría (depende de users, companies)
      'supplies',             // Inventario/Insumos (depende de companies)
      'treatments',           // Tratamientos (depende de companies)
      'user_companies',       // Relaciones usuario-empresa
      'user_roles',          // Relaciones usuario-rol
      'employees',           // Empleados (depende de users, companies)
      'clients',             // Clientes (depende de users, companies)
      'users',               // Usuarios
      'company_settings',    // Configuraciones de empresa
      'companies',           // Empresas
      'roles'                // Roles
    ];

    console.log('🗑️ Limpiando tablas...\n');

    for (const table of tablesToClean) {
      try {
        // Verificar si la tabla existe
        const [tables] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
          [dbConfig.database, table]
        );

        if (tables[0].count > 0) {
          // Contar registros antes de eliminar
          const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          const recordCount = countResult[0].count;

          if (recordCount > 0) {
            // Eliminar todos los registros
            await connection.execute(`DELETE FROM ${table}`);
            console.log(`   ✅ ${table}: ${recordCount} registros eliminados`);
          } else {
            console.log(`   ⚪ ${table}: ya estaba vacía`);
          }

          // Reiniciar AUTO_INCREMENT si la tabla lo tiene
          try {
            await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
          } catch (error) {
            // Ignorar error si la tabla no tiene AUTO_INCREMENT
          }
        } else {
          console.log(`   ⚠️ ${table}: tabla no encontrada`);
        }
      } catch (error) {
        console.log(`   ❌ Error limpiando ${table}:`, error.message);
      }
    }

    // Reactivar verificaciones de claves foráneas
    console.log('\n🔒 Reactivando verificaciones de claves foráneas...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n🎉 ¡Base de datos limpiada exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log('=====================================');
    console.log('✅ Todas las tablas han sido limpiadas');
    console.log('✅ AUTO_INCREMENT reiniciado');
    console.log('✅ Claves foráneas reactivadas');
    console.log('=====================================');
    console.log('\n💡 Ahora puedes ejecutar el seeder para poblar la base de datos:');
    console.log('   npm run db:seed-multi');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('\n🎯 Resultado: Base de datos limpiada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase };
