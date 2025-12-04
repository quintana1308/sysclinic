import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parsear DATABASE_URL
const parseDatabaseUrl = (url: string) => {
  // Formato: mysql://usuario:password@host:puerto/database
  const regex = /mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('DATABASE_URL inválida. Formato esperado: mysql://user:pass@host:port/database');
  }
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
};

// Configuración del pool de conexiones
const dbConfig = process.env.DATABASE_URL 
  ? parseDatabaseUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_citas_db'
    };

// Crear pool de conexiones
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00'
});

// Función helper para ejecutar queries
export const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
};

// Función helper para ejecutar queries que retornan un solo resultado
export const queryOne = async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

// Función para verificar conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Conexión a base de datos exitosa');
    console.log(`📊 Base de datos: ${dbConfig.database}`);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a base de datos:', error);
    return false;
  }
};

// Cerrar pool al terminar
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Conexión a base de datos cerrada');
};
