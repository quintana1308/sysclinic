const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const generateId = () => uuidv4();

// Datos realistas de facturas
const invoiceData = [
  {
    status: 'PAID',
    description: 'Factura por Limpieza Dental Profunda - María García',
    amount: 150.00,
    daysFromNow: -45, // Factura de hace 45 días
    dueDaysFromCreated: 30
  },
  {
    status: 'PENDING',
    description: 'Factura por Blanqueamiento Dental - Carlos López',
    amount: 300.00,
    daysFromNow: -10, // Factura de hace 10 días
    dueDaysFromCreated: 30
  },
  {
    status: 'OVERDUE',
    description: 'Factura por Ortodoncia - Ana Martínez',
    amount: 1200.00,
    daysFromNow: -50, // Factura de hace 50 días
    dueDaysFromCreated: 15 // Vencía a los 15 días
  },
  {
    status: 'PARTIAL',
    description: 'Factura por Implante Dental - Roberto Silva',
    amount: 2500.00,
    daysFromNow: -20, // Factura de hace 20 días
    dueDaysFromCreated: 45
  },
  {
    status: 'PAID',
    description: 'Factura por Extracción de Muela - Laura Rodríguez',
    amount: 80.00,
    daysFromNow: -30, // Factura de hace 30 días
    dueDaysFromCreated: 15
  },
  {
    status: 'PENDING',
    description: 'Factura por Endodoncia - Miguel Torres',
    amount: 450.00,
    daysFromNow: -5, // Factura de hace 5 días
    dueDaysFromCreated: 30
  },
  {
    status: 'OVERDUE',
    description: 'Factura por Corona Dental - Patricia Morales',
    amount: 800.00,
    daysFromNow: -60, // Factura de hace 60 días
    dueDaysFromCreated: 20 // Vencía a los 20 días
  },
  {
    status: 'PAID',
    description: 'Factura por Consulta General - José Hernández',
    amount: 50.00,
    daysFromNow: -15, // Factura de hace 15 días
    dueDaysFromCreated: 30
  },
  {
    status: 'PENDING',
    description: 'Factura por Periodoncia - Carmen Jiménez',
    amount: 350.00,
    daysFromNow: -3, // Factura de hace 3 días
    dueDaysFromCreated: 30
  },
  {
    status: 'CANCELLED',
    description: 'Factura por Cirugía Oral - Francisco Ruiz',
    amount: 600.00,
    daysFromNow: -25, // Factura de hace 25 días
    dueDaysFromCreated: 30
  },
  {
    status: 'PAID',
    description: 'Factura por Prótesis Dental - Elena Vargas',
    amount: 1500.00,
    daysFromNow: -35, // Factura de hace 35 días
    dueDaysFromCreated: 60
  },
  {
    status: 'PENDING',
    description: 'Factura por Radiografía Panorámica - Antonio Castillo',
    amount: 75.00,
    daysFromNow: -7, // Factura de hace 7 días
    dueDaysFromCreated: 15
  },
  {
    status: 'PARTIAL',
    description: 'Factura por Tratamiento de Caries - Sofía Mendoza',
    amount: 200.00,
    daysFromNow: -12, // Factura de hace 12 días
    dueDaysFromCreated: 30
  },
  {
    status: 'OVERDUE',
    description: 'Factura por Brackets Metálicos - Diego Ramírez',
    amount: 900.00,
    daysFromNow: -70, // Factura de hace 70 días
    dueDaysFromCreated: 30 // Vencía a los 30 días
  },
  {
    status: 'PAID',
    description: 'Factura por Limpieza con Flúor - Valentina Cruz',
    amount: 120.00,
    daysFromNow: -22, // Factura de hace 22 días
    dueDaysFromCreated: 30
  }
];

async function seedInvoices() {
  let connection;
  
  try {
    // Crear conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gestion_citas_clinica'
    });

    console.log('🔄 Iniciando seeder de facturas...');

    // Obtener algunos clientes existentes
    const [clients] = await connection.execute(`
      SELECT id, name FROM clients 
      ORDER BY createdAt DESC 
      LIMIT 15
    `);

    if (clients.length === 0) {
      console.log('❌ No hay clientes en la base de datos. Ejecuta primero el seeder de clientes.');
      return;
    }

    // Obtener algunas citas existentes (opcional, para algunas facturas)
    const [appointments] = await connection.execute(`
      SELECT id, clientId FROM appointments 
      WHERE status = 'confirmed'
      ORDER BY createdAt DESC 
      LIMIT 10
    `);

    console.log(`📋 Encontrados ${clients.length} clientes y ${appointments.length} citas confirmadas`);

    // Limpiar facturas existentes (opcional)
    await connection.execute('DELETE FROM invoices WHERE description LIKE "Factura por%"');
    console.log('🧹 Facturas de prueba anteriores eliminadas');

    // Insertar facturas de prueba
    for (let i = 0; i < invoiceData.length && i < clients.length; i++) {
      const invoice = invoiceData[i];
      const client = clients[i];
      
      // Calcular fechas
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() + invoice.daysFromNow);
      
      const dueDate = new Date(createdDate);
      dueDate.setDate(dueDate.getDate() + invoice.dueDaysFromCreated);

      // Usar una cita si está disponible (50% de probabilidad)
      const appointmentId = (appointments.length > 0 && Math.random() > 0.5) 
        ? appointments[Math.floor(Math.random() * appointments.length)].id 
        : null;

      const invoiceId = generateId();

      await connection.execute(`
        INSERT INTO invoices (
          id, clientId, appointmentId, amount, status, description, dueDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId,
        client.id,
        appointmentId,
        invoice.amount,
        invoice.status,
        invoice.description,
        dueDate.toISOString().split('T')[0], // Solo fecha
        createdDate.toISOString(),
        createdDate.toISOString()
      ]);

      console.log(`✅ Factura creada: ${invoice.description} - $${invoice.amount} (${invoice.status})`);
    }

    // Mostrar estadísticas
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN status = 'PARTIAL' THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
        SUM(amount) as totalAmount,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as paidAmount
      FROM invoices
    `);

    console.log('\n📊 Estadísticas de facturas:');
    console.log(`   Total: ${stats[0].total} facturas`);
    console.log(`   Pagadas: ${stats[0].paid} ($${stats[0].paidAmount})`);
    console.log(`   Pendientes: ${stats[0].pending}`);
    console.log(`   Vencidas: ${stats[0].overdue}`);
    console.log(`   Parciales: ${stats[0].partial}`);
    console.log(`   Canceladas: ${stats[0].cancelled}`);
    console.log(`   Monto total: $${stats[0].totalAmount}`);

    console.log('\n✅ Seeder de facturas completado exitosamente');

  } catch (error) {
    console.error('❌ Error en el seeder de facturas:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedInvoices()
    .then(() => {
      console.log('🎉 Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedInvoices };
