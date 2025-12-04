# 🚀 Guía de Despliegue SysClinic en SiteGround

## 📋 Opciones de Despliegue

### OPCIÓN A: Hosting Compartido (Solo Frontend)
**Limitaciones:** Solo archivos estáticos, sin backend Node.js

### OPCIÓN B: Cloud/VPS (Aplicación Completa)
**Recomendado:** Para funcionalidad completa con backend

---

## 🔧 OPCIÓN A: Hosting Compartido

### 1. Preparar Frontend para Producción

```bash
# En tu computadora local
cd ProyectoNew
npm run client:build
```

### 2. Configurar Variables de Entorno del Cliente

Editar `client/.env`:
```env
REACT_APP_API_URL=https://tu-backend-externo.com/api
REACT_APP_NAME="Tu Clínica"
```

### 3. Subir Archivos via cPanel

1. **Acceder a cPanel** de SiteGround
2. **Abrir File Manager**
3. **Navegar a public_html/**
4. **Subir contenido de `client/build/`:**
   - Seleccionar todos los archivos de `client/build/`
   - Arrastrar y soltar en public_html/
   - O usar "Upload" y seleccionar archivos

### 4. Configurar .htaccess para React Router

Crear archivo `.htaccess` en public_html/:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# Habilitar compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache estático
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

---

## 🆓 BACKEND GRATUITO para Opción A

### Railway (Recomendado)
**Límite:** $5 USD crédito mensual

#### Pasos para Railway:

1. **Crear cuenta en railway.app**
2. **Preparar tu backend:**
```bash
# Agregar script de inicio en server/package.json
"scripts": {
  "start": "node dist/index.js",
  "build": "tsc"
}
```

3. **Crear railway.json en server/:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

4. **Variables de entorno en Railway:**
```env
DATABASE_URL=mysql://usuario:password@host:port/database
JWT_SECRET=tu_secreto_seguro
NODE_ENV=production
PORT=3000
CLIENT_URL=https://tu-frontend-siteground.com
```

5. **Deploy:**
   - Conectar repositorio GitHub
   - Railway detecta automáticamente Node.js
   - Deploy automático en cada push

6. **Base de datos MySQL:**
   - Agregar servicio MySQL en Railway
   - Copiar URL de conexión
   - Importar tu esquema SQL

### Render (Alternativa)
**Límite:** Gratuito con limitaciones

#### Configuración Render:
1. **Crear cuenta en render.com**
2. **Crear Web Service desde GitHub**
3. **Configuración:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

4. **Base de datos PostgreSQL gratuita**
5. **Migrar de MySQL a PostgreSQL** (requiere cambios)

### Configurar Frontend para Backend Gratuito

**Actualizar client/.env:**
```env
# Para Railway
REACT_APP_API_URL=https://tu-app-railway.up.railway.app/api

# Para Render  
REACT_APP_API_URL=https://tu-app.onrender.com/api
```

**Recompilar frontend:**
```bash
npm run client:build
# Subir nuevamente a SiteGround
```

---

## 🚀 OPCIÓN B: Cloud/VPS (Aplicación Completa)

### 1. Preparar Archivos de Producción

#### Backend (.env de producción):
```env
DATABASE_URL="mysql://usuario:password@localhost:3306/gestion_citas_db"
JWT_SECRET="tu_secreto_jwt_super_seguro_produccion"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="production"
CLIENT_URL="https://tu-dominio.com"
```

#### Frontend (.env de producción):
```env
REACT_APP_API_URL=https://tu-dominio.com/api
REACT_APP_NAME="Tu Clínica"
```

### 2. Crear Base de Datos en SiteGround

1. **Acceder a cPanel**
2. **MySQL Databases**
3. **Crear nueva base de datos:**
   - Nombre: `tu_usuario_gestion_citas`
4. **Crear usuario MySQL:**
   - Usuario: `tu_usuario_db`
   - Contraseña: (segura)
5. **Asignar usuario a base de datos** con todos los privilegios

### 3. Importar Esquema de Base de Datos

1. **phpMyAdmin** en cPanel
2. **Seleccionar tu base de datos**
3. **Importar** → Seleccionar `db/bd_estructura.sql`
4. **Ejecutar importación**

### 4. Subir Archivos del Proyecto

#### Estructura en el servidor:
```
public_html/
├── build/              # Frontend compilado
│   ├── index.html
│   ├── static/
│   └── ...
├── server/             # Backend Node.js
│   ├── dist/          # Código compilado
│   ├── package.json
│   ├── .env
│   └── node_modules/
└── .htaccess
```

#### Comandos de subida:
```bash
# Comprimir archivos localmente
zip -r sysclinic-frontend.zip client/build/*
zip -r sysclinic-backend.zip server/

# Subir via File Manager o FTP
# Extraer en las carpetas correspondientes
```

### 5. Instalar Dependencias del Servidor

**Via SSH (si está disponible):**
```bash
cd public_html/server
npm install --production
```

**Via cPanel Node.js App (si está disponible):**
1. **Node.js Apps** en cPanel
2. **Create Application**
3. **Configurar:**
   - Node.js version: 16+
   - Application root: server/
   - Application URL: tu-dominio.com/api
   - Application startup file: dist/index.js

### 6. Configurar .htaccess Principal

Crear `.htaccess` en public_html/:
```apache
# Redirigir API al backend
RewriteEngine On

# API routes al backend Node.js
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# Frontend React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# Seguridad
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

---

## 🔒 Configuración de Seguridad

### 1. Variables de Entorno Seguras

**Generar JWT Secret seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Configurar HTTPS

1. **SSL/TLS** en cPanel
2. **Let's Encrypt** (gratuito)
3. **Forzar HTTPS** en .htaccess:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🧪 Verificación del Despliegue

### 1. Verificar Frontend
- Acceder a `https://tu-dominio.com`
- Verificar que carga correctamente
- Probar navegación entre páginas

### 2. Verificar Backend (Solo Opción B)
- Acceder a `https://tu-dominio.com/api/health`
- Debe responder: `{"status": "OK", "timestamp": "..."}`

### 3. Verificar Base de Datos
- Intentar login con credenciales por defecto
- Verificar que las consultas funcionan

---

## 🚨 Solución de Problemas

### Error 500 - Internal Server Error
```bash
# Verificar logs en cPanel
# Error Logs → Revisar últimos errores
```

### Error de Base de Datos
```bash
# Verificar conexión en .env
# Verificar permisos de usuario MySQL
```

### Error 404 en Rutas React
```bash
# Verificar .htaccess
# Verificar que index.html existe
```

### Backend no responde
```bash
# Verificar que Node.js está ejecutándose
# Verificar puerto en configuración
# Revisar logs de aplicación
```

---

## 📝 Checklist Final

### Antes del Despliegue:
- [ ] Compilar frontend (`npm run client:build`)
- [ ] Compilar backend (`npm run server:build`)
- [ ] Configurar variables de entorno de producción
- [ ] Probar localmente con configuración de producción

### Durante el Despliegue:
- [ ] Crear base de datos en SiteGround
- [ ] Importar esquema SQL
- [ ] Subir archivos compilados
- [ ] Configurar .htaccess
- [ ] Instalar dependencias del servidor

### Después del Despliegue:
- [ ] Verificar frontend carga correctamente
- [ ] Verificar API responde
- [ ] Probar login y funcionalidades principales
- [ ] Configurar SSL/HTTPS
- [ ] Configurar backups automáticos

---

## 🔄 Actualizaciones Futuras

### Para actualizar el sitio:
1. **Compilar cambios localmente**
2. **Subir solo archivos modificados**
3. **Reiniciar aplicación Node.js** (si aplica)
4. **Verificar funcionamiento**

### Backup antes de actualizar:
```bash
# Descargar archivos actuales
# Exportar base de datos desde phpMyAdmin
```

---

## 📞 Soporte

### Recursos de SiteGround:
- **Documentación:** https://www.siteground.com/kb/
- **Soporte 24/7:** Via chat o tickets
- **Tutoriales Node.js:** Para planes Cloud/VPS

### Logs importantes:
- **Error Logs** en cPanel
- **Access Logs** para tráfico
- **Application Logs** para Node.js
