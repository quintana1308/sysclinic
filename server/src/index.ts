import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Importar rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import employeeRoutes from './routes/employee.routes';
import appointmentRoutes from './routes/appointment.routes';
import treatmentRoutes from './routes/treatment.routes';
import supplyRoutes from './routes/supply.routes';
import paymentRoutes from './routes/payment.routes';
import invoiceRoutes from './routes/invoice.routes';
import dashboardRoutes from './routes/dashboard.routes';
import companyRoutes from './routes/company.routes';
import reportRoutes from './routes/report.routes';
import licenseRoutes from './routes/license.routes';

// Configurar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Configurar trust proxy para Railway
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // límite de 500 requests por ventana por IP (aumentado para desarrollo)
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middlewares globales
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ruta de salud
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/supplies', supplyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/licenses', licenseRoutes);

// Middleware para rutas API no encontradas (debe ir después de todas las rutas)
app.use('/api/*', notFound);

// Servir frontend en producción
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });
}

// Middlewares de manejo de errores (notFound debe ir al final)
app.use(errorHandler);

// Función para inicializar el servidor
async function startServer() {
  try {
    // Probar conexión a la base de datos
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();
