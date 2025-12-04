# SysClinic - Sistema Integral de Gestión Clínica

**SysClinic** es un sistema completo de gestión para clínicas y centros médicos desarrollado con tecnologías modernas y arquitectura multi-empresa.

## 📋 Características

- ✅ **Backend completo** con MySQL puro
- ✅ **Autenticación y autorización** con JWT
- ✅ **Gestión de usuarios, clientes y empleados**
- ✅ **Sistema de citas y tratamientos**
- ✅ **Facturación y pagos**
- ✅ **Inventario de insumos**
- ✅ **Dashboard con estadísticas**
- ✅ **Reportes y exportación**
- ✅ **Historial médico**
- ✅ **Auditoría completa**

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 16+ 
- MySQL 8.0+
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd ProyectoNew
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias (raíz, servidor y cliente)
npm run install:all

# O instalar manualmente
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Configurar base de datos

1. **Crear la base de datos:**
   ```sql
   CREATE DATABASE gestion_citas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Ejecutar el esquema:**
   ```bash
   mysql -u root -p gestion_citas_db < db/schema.sql
   ```

### 4. Configurar variables de entorno

#### Servidor (`server/.env`)
```bash
cp server/.env.example server/.env
```

Editar `server/.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/gestion_citas_db"
JWT_SECRET="tu_secreto_jwt_super_seguro"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
CLIENT_URL="http://localhost:3000"
```

#### Cliente (`client/.env`)
```bash
cp client/.env.example client/.env
```

Editar `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME="Clínica Bella"
```

### 5. Ejecutar la aplicación

#### Desarrollo (ambos servidores)
```bash
npm run dev
```

#### Por separado
```bash
# Terminal 1 - Servidor
npm run server:dev

# Terminal 2 - Cliente  
npm run client:dev
```

## 🔑 Credenciales por defecto

- **Email:** admin@clinica.com
- **Contraseña:** admin123

## 📁 Estructura del proyecto

```
ProyectoNew/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── contexts/       # Contextos de React
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios API
│   │   └── App.tsx         # Componente principal
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/         # Configuración DB
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middlewares
│   │   ├── routes/         # Rutas API
│   │   ├── types/          # Tipos TypeScript
│   │   ├── utils/          # Utilidades
│   │   └── index.ts        # Servidor principal
│   ├── package.json
│   └── .env.example
├── db/
│   └── schema.sql          # Esquema de base de datos
├── package.json            # Scripts del monorepo
└── README.md
```

## 🛠️ Tecnologías utilizadas

### Backend
- **Node.js** + **Express** - Servidor web
- **TypeScript** - Tipado estático
- **MySQL** + **mysql2** - Base de datos (sin ORM)
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **uuid** - Generación de IDs únicos

### Frontend
- **React** + **TypeScript** - Interfaz de usuario
- **React Router** - Navegación
- **React Query** - Gestión de estado servidor
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **React Hot Toast** - Notificaciones

## 📊 Base de datos

El sistema utiliza **MySQL puro** sin ORM. El esquema incluye:

- **Usuarios y roles** - Sistema de autenticación
- **Clientes** - Información de pacientes
- **Empleados** - Personal de la clínica
- **Tratamientos** - Servicios disponibles
- **Citas** - Programación de servicios
- **Facturación y pagos** - Gestión financiera
- **Inventario** - Control de insumos
- **Auditoría** - Registro de cambios
- **Configuración** - Ajustes del sistema

## 🔧 Scripts disponibles

```bash
# Desarrollo
npm run dev                 # Ejecutar cliente y servidor
npm run server:dev          # Solo servidor
npm run client:dev          # Solo cliente

# Construcción
npm run build              # Construir ambos proyectos
npm run server:build       # Solo servidor
npm run client:build       # Solo cliente

# Producción
npm start                  # Ejecutar servidor en producción

# Instalación
npm run install:all        # Instalar todas las dependencias
```

## 🚨 Solución de problemas

### Error de conexión a la base de datos
1. Verificar que MySQL esté ejecutándose
2. Comprobar las credenciales en `.env`
3. Asegurarse de que la base de datos existe

### Errores de TypeScript
Los errores de TypeScript son normales antes de instalar las dependencias:
```bash
npm run install:all
```

### Puerto ocupado
Si el puerto 5000 está ocupado, cambiar en `server/.env`:
```env
PORT=5001
```

## 📝 Próximos pasos

1. **Instalar dependencias** - `npm run install:all`
2. **Configurar base de datos** - Ejecutar `schema.sql`
3. **Configurar variables de entorno**
4. **Ejecutar aplicación** - `npm run dev`
5. **Acceder al sistema** con las credenciales por defecto

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---
**Desarrollado con ❤️ para la gestión eficiente de clínicas estéticas**

Sistema completo de gestión para clínicas estéticas desarrollado con tecnologías modernas.

## 🚀 Tecnologías

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **React Query** para estado del servidor
- **Axios** para peticiones HTTP
- **Recharts** para visualización de datos
- **React Hook Form + Yup** para formularios

### Backend
- **Node.js** con Express
- **TypeScript**
- **MySQL** como base de datos
- **JWT** para autenticación
- **Bcrypt** para encriptación

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL/MariaDB
- npm o yarn

## 🔧 Instalación

```bash
# 1. Instalar todas las dependencias
npm run install:all

# 2. Configurar variables de entorno
# Copiar .env.example a .env en server/ y client/

# 3. Crear base de datos
# Importar db/schema.sql en MySQL

# 4. Ejecutar en desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
ProyectoNew/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── services/      # Servicios API
│   │   ├── hooks/         # Custom hooks
│   │   ├── contexts/      # Context providers
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilidades
│   └── package.json
│
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── config/        # Configuración
│   │   ├── controllers/   # Controladores
│   │   ├── routes/        # Rutas API
│   │   ├── middleware/    # Middlewares
│   │   ├── services/      # Lógica de negocio
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilidades
│   └── package.json
│
├── db/                    # Scripts de base de datos
│   └── schema.sql
│
└── package.json           # Scripts principales
```

## 🔐 Usuarios por Defecto

Después de ejecutar el seed:

- **Admin:** admin@clinica.com / Admin123!
- **Empleado:** empleado@clinica.com / Empleado123!
- **Cliente:** cliente@clinica.com / Cliente123!

## 📝 Scripts Disponibles

```bash
npm run dev              # Ejecutar en desarrollo (cliente + servidor)
npm run build            # Construir para producción
npm start               # Iniciar servidor de producción
npm run install:all     # Instalar todas las dependencias
```

## 🌐 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 📄 Licencia

MIT
