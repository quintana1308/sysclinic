---
trigger: manual
---

🚀 Configuración Actual del Proyecto SysClinic
📋 Información General
Nombre del Proyecto: SysClinic - Sistema integral de gestión clínica
Arquitectura: Frontend React + Backend Node.js/TypeScript + Base de datos MySQL
Estado: Desplegado en producción
🌐 URLs de Producción
Backend (API)
Plataforma: Railway
URL Pública: https://sysclinic-production.up.railway.app
API Base: https://sysclinic-production.up.railway.app/api
Health Check: https://sysclinic-production.up.railway.app/api/health
Frontend
Plataforma: SiteGround
URL Pública: https://carlosagusting2.sg-host.com/
Dominio: carlosagusting2.sg-host.com
Base de Datos
Proveedor: FreeSQLDatabase
URL de Conexión: mysql://sql10810669:WBHM1gji5b@sql10.freesqldatabase.com:3306/sql10810669
Host: sql10.freesqldatabase.com
Puerto: 3306
Usuario: sql10810669
Base de Datos: sql10810669
🏗️ Estructura del Proyecto
SysClinic/
├── client/                          # Frontend React
│   ├── src/
│   ├── public/
│   ├── .env.production             # Variables de producción
│   └── package.json
├── server/                         # Backend Node.js/TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── types/
│   │   └── seeders/
│   ├── .env                       # Variables locales
│   ├── .env.example              # Plantilla de variables
│   ├── railway.json              # Configuración Railway
│   └── package.json
├── db/                            # Scripts de base de datos
│   ├── bd_completa.sql
│   └── bd_estructura.sql
└── .htaccess                      # Configuración Apache para SiteGround
⚙️ Variables de Entorno
Backend (Railway)
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://sql10810669:WBHM1gji5b@sql10.freesqldatabase.com:3306/sql10810669
JWT_SECRET=sysclinic_super_secret_key_2024_production_64_chars_minimum_secure
CLIENT_URL=https://carlosagusting2.sg-host.com
Frontend (.env.production)
REACT_APP_API_URL=https://sysclinic-production.up.railway.app/api
REACT_APP_NAME=SysClinic - Gestión Clínica
GENERATE_SOURCEMAP=false
🔧 Configuraciones Importantes
CORS
Backend configurado para permitir origen: https://carlosagusting2.sg-host.com
Headers permitidos: Content-Type, Authorization
Métodos permitidos: GET, POST, PUT, DELETE, OPTIONS
Autenticación
Sistema JWT con tokens de 7 días de duración
Almacenamiento en localStorage del frontend
Interceptores automáticos en axios
Base de Datos
Motor: MySQL 8.0
Conexión: Directa via FreeSQLDatabase
Tablas principales: users, clients, employees, appointments, treatments, payments
Datos de prueba: Incluidos via seeders
👥 Usuarios de Prueba
Usuario Master
Email: master@sistema.com
Password: Master123!
Acceso: Todas las empresas
Empresa 1: Clínica Estética Bella
Admin: admin@clinicabella.com / Admin123!
Empleados:
ana.martinez@clinicabella.com / Empleado123
carlos.rodriguez@clinicabella.com / Empleado123
🚀 Comandos de Desarrollo
Frontend
# Desarrollo local
npm run client:dev

# Build para producción
npm run client:build

# Desde carpeta client
cd client && npm start
cd client && npm run build
Backend
# Desarrollo local
npm run server:dev

# Build para producción
npm run server:build

# Desde carpeta server
cd server && npm run dev
cd server && npm run build
Proyecto Completo
# Instalar todas las dependencias
npm run install:all

# Desarrollo completo (frontend + backend)
npm run dev

# Build completo
npm run build
📦 Despliegue
Backend (Railway)
Push a GitHub automáticamente despliega
Variables de entorno configuradas en Railway Dashboard
Build automático con npm install && npm run build
Start con npm start
Frontend (SiteGround)
Build local: npm run client:build
Subir contenido de client/build/ a public_html/
Configurar .htaccess para SPA routing
Variables en .env.production
Base de Datos (FreeSQLDatabase)
Conexión directa desde Railway
Importación manual de esquemas SQL
Gestión via phpMyAdmin o MySQL Workbench
🔍 Endpoints Principales
Autenticación
POST /api/auth/login - Login de usuario
POST /api/auth/register - Registro de usuario
GET /api/auth/me - Información del usuario actual
Gestión
GET /api/clients - Lista de clientes
GET /api/appointments - Lista de citas
GET /api/treatments - Lista de tratamientos
GET /api/employees - Lista de empleados
Utilidades
GET /api/health - Health check del servidor
🛠️ Tecnologías Utilizadas
Frontend
React 18
TypeScript
Axios para HTTP requests
React Router para navegación
CSS Modules / Styled Components
Backend
Node.js
Express.js
TypeScript
MySQL2 para base de datos
JWT para autenticación
bcryptjs para hashing
CORS, Helmet, Morgan
Base de Datos
MySQL 8.0
Esquema normalizado
Relaciones FK entre tablas
Índices optimizados
📝 Notas Importantes
Seguridad: Todas las conexiones usan HTTPS en producción
CORS: Configurado específicamente para el dominio de SiteGround
JWT: Tokens con expiración de 7 días
Variables: Separadas por entorno (development/production)
Build: Optimizado para producción sin source maps
Cache: Configurado en .htaccess para recursos estáticos
🔄 Flujo de Actualización
Desarrollo local con variables de desarrollo
Commit y push a GitHub
Railway despliega automáticamente el backend
Build manual del frontend con variables de producción
Subida a SiteGround via File Manager
Verificación de funcionamiento completo