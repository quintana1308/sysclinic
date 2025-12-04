import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export const initializeDatabase = async () => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    
    console.log('🔄 Verificando si la base de datos está inicializada...');
    
    // Verificar si ya existen tablas
    const [tables] = await connection.execute('SHOW TABLES');
    
    if ((tables as any[]).length === 0) {
      console.log('📊 Base de datos vacía, inicializando...');
      
      // Leer archivo SQL
      const sqlPath = path.join(__dirname, '../../..', 'db', 'bd_completa.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Dividir en statements individuales
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // Ejecutar cada statement
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.execute(statement);
        }
      }
      
      console.log('✅ Base de datos inicializada correctamente');
    } else {
      console.log('✅ Base de datos ya está inicializada');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
};
