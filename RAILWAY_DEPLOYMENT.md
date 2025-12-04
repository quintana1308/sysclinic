# 🚂 Guía Completa: Desplegar SysClinic Backend en Railway

## 📋 Preparación Previa (15 minutos)

### 1. Verificar estructura del proyecto
Tu proyecto debe tener esta estructura:
```
ProyectoNew/
├── server/
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/
├── db/
└── package.json
```

### 2. Preparar server/package.json
Verificar que tenga estos scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### 3. Crear cuenta GitHub (si no tienes)
1. **Ir a github.com**
2. **Click "Sign up"**
3. **Completar registro:**
   - Username: tu-usuario
   - Email: tu-email
   - Password: contraseña segura
4. **Verificar email**
5. **Crear repositorio nuevo:**
   - Name: "sysclinic"
   - Description: "Sistema de gestión clínica"
   - Public o Private (recomiendo Private)
   - ✅ Add README file

### 4. Subir código a GitHub

#### Opción A: Via GitHub Desktop (Fácil)
1. **Descargar GitHub Desktop**
2. **Login con tu cuenta**
3. **Clone repository** → Seleccionar "sysclinic"
4. **Copiar archivos** de ProyectoNew/ al repositorio clonado
5. **Commit changes** → "Initial SysClinic upload"
6. **Push to origin**

#### Opción B: Via comandos Git
```bash
# En tu carpeta ProyectoNew
git init
git add .
git commit -m "Initial SysClinic commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/sysclinic.git
git push -u origin main
```

**⚠️ Importante:** 
- Reemplaza "TU-USUARIO" con tu username real de GitHub
- Si tienes problemas con Git, usa GitHub Desktop (más fácil)
- Asegúrate de que el repositorio sea privado si contiene información sensible

---

## 🚀 Paso 1: Configurar Railway (20 minutos)

### 1.1 Crear cuenta Railway
1. **Ir a railway.app**
2. **Click "Login"**
3. **Seleccionar "Continue with GitHub"**
4. **Autorizar Railway** → Click "Authorize Railway"
5. **Completar perfil** si es necesario

### 1.2 Crear nuevo proyecto
1. **En Railway Dashboard:**
   - Click "New Project"
   - Seleccionar "Deploy from GitHub repo"

2. **Seleccionar repositorio:**
   - Buscar "sysclinic" en la lista
   - Click en tu repositorio

3. **Configurar servicio:**
   - Railway detectará automáticamente Node.js
   - **Root Directory:** Cambiar a "server"
   - Click "Deploy"

### 1.3 Configurar variables de entorno
1. **En tu proyecto Railway:**
   - Click en el servicio creado
   - Ir a pestaña "Variables"
   - Click "New Variable"

2. **Agregar estas variables una por una:**

```env
# Variable 1
NODE_ENV=production

# Variable 2  
PORT=3000

# Variable 3
JWT_SECRET=sysclinic_super_secret_key_2024_production_64_chars_minimum

# Variable 4 (temporal, la actualizaremos después)
DATABASE_URL=mysql://root:password@localhost:3306/temp

# Variable 5 (actualizar con tu dominio real)
CLIENT_URL=https://tu-dominio-siteground.com
```

**💡 Tip:** Genera un JWT_SECRET seguro:
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗄️ Paso 2: Configurar Base de Datos MySQL (15 minutos)

### 2.1 Agregar servicio MySQL
1. **En tu proyecto Railway:**
   - Click "New Service"
   - Seleccionar "Database"
   - Click "Add MySQL"

2. **Esperar despliegue:**
   - Railway creará automáticamente la BD
   - Aparecerá nuevo servicio "MySQL"

### 2.2 Obtener credenciales de conexión
1. **Click en servicio MySQL**
2. **Ir a pestaña "Connect"**
3. **Copiar "MySQL Connection URL"**
   - Formato: `mysql://root:password@host:port/railway`

### 2.3 Actualizar variable DATABASE_URL
1. **Volver al servicio Node.js**
2. **Pestaña "Variables"**
3. **Editar DATABASE_URL:**
   - Pegar la URL copiada del MySQL
   - Click "Update"

### 2.4 Importar esquema de base de datos

#### Opción A: Via Railway CLI (Recomendado)
1. **Instalar Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login y conectar:**
```bash
railway login
railway link
# Seleccionar tu proyecto
```

3. **Conectar a MySQL:**
```bash
railway connect mysql
```

4. **Importar esquema:**
```sql
-- En la consola MySQL
source /ruta/a/tu/ProyectoNew/db/bd_estructura.sql;
```

#### Opción B: Via herramienta externa
1. **Usar MySQL Workbench o phpMyAdmin**
2. **Conectar con credenciales de Railway**
3. **Importar archivo `db/bd_estructura.sql`**

### 2.5 Verificar importación
```sql
-- Verificar tablas creadas
SHOW TABLES;

-- Verificar datos de ejemplo
SELECT * FROM users LIMIT 5;
```

---

## 🎨 Paso 3: Configurar Frontend para Railway (10 minutos)

### 3.1 Obtener URL de tu API
1. **En Railway Dashboard:**
   - Click en tu servicio Node.js
   - Ir a pestaña "Settings"
   - Buscar "Public Networking"
   - **Copiar la URL:** `https://tu-app-production-xxxx.up.railway.app`

### 3.2 Actualizar configuración del frontend
1. **Editar `client/.env`:**
```env
# Reemplazar con tu URL real de Railway
REACT_APP_API_URL=https://tu-app-production-xxxx.up.railway.app/api
REACT_APP_NAME="Tu Clínica Estética"
```

2. **Verificar archivo existe:**
   - Si no existe `client/.env`, crearlo
   - Asegurarse que esté en la carpeta `client/`

### 3.3 Recompilar frontend
```bash
# En la carpeta ProyectoNew
npm run client:build
```

### 3.4 Subir a SiteGround
1. **Acceder a cPanel de SiteGround**
2. **Abrir File Manager**
3. **Ir a public_html/**
4. **Eliminar archivos anteriores** (si los hay)
5. **Subir contenido de `client/build/`:**
   - Seleccionar todos los archivos de `client/build/`
   - Arrastrar a public_html/
   - O usar botón "Upload"

### 3.5 Configurar .htaccess en SiteGround
Crear archivo `.htaccess` en public_html/:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]

# CORS para Railway
Header always set Access-Control-Allow-Origin "https://tu-app-production-xxxx.up.railway.app"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css application/xml application/xhtml+xml application/rss+xml application/javascript application/x-javascript
</IfModule>
```

---

## ✅ Paso 4: Verificación y Pruebas (10 minutos)

### 4.1 Verificar despliegue del backend
1. **Revisar logs en Railway:**
   - Click en tu servicio Node.js
   - Pestaña "Deployments"
   - Click en el último deployment
   - Revisar logs: debe mostrar "Server running on port 3000"

2. **Probar endpoint de salud:**
   - Ir a: `https://tu-app-production-xxxx.up.railway.app/api/health`
   - **Debe responder:** `{"status": "OK", "timestamp": "..."}`

### 4.2 Verificar base de datos
1. **Probar endpoint de usuarios:**
   - `https://tu-app-production-xxxx.up.railway.app/api/auth/login`
   - Método POST con:
   ```json
   {
     "email": "admin@clinica.com",
     "password": "admin123"
   }
   ```

### 4.3 Verificar frontend completo
1. **Acceder a tu dominio SiteGround**
2. **Verificar que carga la aplicación**
3. **Probar login:**
   - Email: `admin@clinica.com`
   - Password: `admin123`
4. **Verificar navegación entre páginas**
5. **Probar crear una cita de prueba**

---

## 🎯 Configuración Adicional

### Configurar dominio personalizado (Opcional)
1. **En Railway:**
   - Pestaña "Settings" del servicio
   - "Custom Domain"
   - Agregar: `api.tu-dominio.com`
2. **En tu DNS:**
   - Crear registro CNAME: `api` → `tu-app-production-xxxx.up.railway.app`

### Configurar SSL automático
- Railway incluye SSL automático
- Verificar que todas las URLs usen HTTPS

---

## 🚨 Solución de Problemas Comunes

### ❌ Error: "Cannot connect to database"
**Solución:**
1. Verificar DATABASE_URL en variables de Railway
2. Asegurarse que MySQL service esté running
3. Revisar logs del servicio MySQL

### ❌ Error: "CORS policy blocked"
**Solución:**
1. Verificar CLIENT_URL en variables de Railway
2. Actualizar con tu dominio real de SiteGround
3. Redeploy el servicio

### ❌ Error 500 en API
**Solución:**
1. **Revisar logs detallados:**
   - Railway Dashboard → Tu servicio → Deployments → Logs
2. **Verificar variables de entorno:**
   - Todas las variables requeridas están configuradas
   - JWT_SECRET tiene mínimo 32 caracteres

### ❌ Frontend no conecta con backend
**Solución:**
1. **Verificar REACT_APP_API_URL:**
   ```bash
   # Debe apuntar a tu Railway URL
   REACT_APP_API_URL=https://tu-app-production-xxxx.up.railway.app/api
   ```
2. **Recompilar frontend:**
   ```bash
   npm run client:build
   ```
3. **Subir nuevamente a SiteGround**

### ❌ Error: "Module not found"
**Solución:**
1. **Verificar package.json en server/**
2. **Forzar rebuild en Railway:**
   - Settings → "Redeploy"

---

## 📊 Monitoreo y Mantenimiento

### Revisar uso de recursos
1. **Railway Dashboard → Usage**
2. **Monitorear:**
   - CPU usage
   - Memory usage
   - Network requests
   - Database connections

### Logs importantes
```bash
# Via Railway CLI
railway logs

# Logs en tiempo real
railway logs --follow
```

### Backup de base de datos
```bash
# Conectar y exportar
railway connect mysql
mysqldump --all-databases > backup_$(date +%Y%m%d).sql
```

---

## 🎉 ¡Felicidades!

Tu aplicación SysClinic ahora está desplegada:
- ✅ **Frontend:** En SiteGround (tu-dominio.com)
- ✅ **Backend:** En Railway (tu-app-production-xxxx.up.railway.app)
- ✅ **Base de datos:** MySQL en Railway
- ✅ **SSL:** Habilitado automáticamente

### Próximos pasos:
1. **Configurar dominio personalizado** para la API
2. **Configurar backups automáticos**
3. **Monitorear rendimiento**
4. **Actualizar contenido según necesidades**

### URLs importantes:
- **Aplicación:** https://tu-dominio-siteground.com
- **API:** https://tu-app-production-xxxx.up.railway.app/api
- **Health Check:** https://tu-app-production-xxxx.up.railway.app/api/health
- **Railway Dashboard:** https://railway.app/dashboard

---

## 📞 Soporte

### Documentación oficial:
- **Railway:** https://docs.railway.app/
- **SiteGround:** https://www.siteground.com/kb/

### Comandos útiles:
```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway logs
railway connect mysql

# Git para actualizaciones
git add .
git commit -m "Update: descripción del cambio"
git push origin main
# Railway redeploy automáticamente
```
