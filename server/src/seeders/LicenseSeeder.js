const { v4: generateId } = require('uuid');

class LicenseSeeder {
  constructor(queryFunction) {
    this.query = queryFunction;
  }

  async run() {
    try {
      console.log('🌱 Ejecutando LicenseSeeder...');
      
      // Verificar si ya existen licencias
      const existingLicenses = await this.query('SELECT COUNT(*) as count FROM licenses');
      if (existingLicenses[0].count > 0) {
        console.log('✅ Las licencias ya existen, omitiendo inserción');
        const licenses = await this.query('SELECT id, name, type, price FROM licenses ORDER BY type');
        console.log('📋 Licencias existentes:');
        licenses.forEach(license => {
          console.log(`   - ${license.name} (${license.type}): $${license.price}`);
        });
        return { success: true, message: 'Licencias ya existen', data: licenses };
      }
      
      // Generar IDs únicos
      const basicId = generateId();
      const premiumId = generateId();
      const enterpriseId = generateId();
      
      console.log('📋 Creando licencias con IDs:');
      console.log(`   - Básica: ${basicId}`);
      console.log(`   - Premium: ${premiumId}`);
      console.log(`   - Empresarial: ${enterpriseId}`);
      
      // Definir las licencias
      const licenses = [
        {
          id: basicId,
          name: 'Plan Básico',
          type: 'basic',
          description: 'Plan básico para clínicas pequeñas con funcionalidades esenciales',
          maxUsers: 10,
          maxClients: 100,
          maxStorage: 5 * 1024 * 1024 * 1024, // 5GB en bytes
          features: [
            "Gestión de usuarios",
            "Gestión de clientes", 
            "Gestión de citas",
            "Gestión de tratamientos",
            "Inventario básico",
            "Reportes básicos"
          ],
          price: 29.99,
          currency: 'USD',
          billingCycle: 'monthly',
          isActive: true
        },
        {
          id: premiumId,
          name: 'Plan Premium',
          type: 'premium',
          description: 'Plan avanzado para clínicas medianas con funcionalidades adicionales',
          maxUsers: 50,
          maxClients: 500,
          maxStorage: 25 * 1024 * 1024 * 1024, // 25GB en bytes
          features: [
            "Gestión de usuarios",
            "Gestión de clientes",
            "Gestión de citas", 
            "Gestión de tratamientos",
            "Inventario básico",
            "Inventario avanzado",
            "Reportes básicos",
            "Reportes avanzados",
            "Facturación",
            "Notificaciones Email"
          ],
          price: 79.99,
          currency: 'USD',
          billingCycle: 'monthly',
          isActive: true
        },
        {
          id: enterpriseId,
          name: 'Plan Empresarial',
          type: 'enterprise',
          description: 'Plan completo para grandes organizaciones con todas las funcionalidades',
          maxUsers: -1, // Ilimitado
          maxClients: -1, // Ilimitado
          maxStorage: 100 * 1024 * 1024 * 1024, // 100GB en bytes
          features: [
            "Gestión de usuarios",
            "Gestión de clientes",
            "Gestión de citas",
            "Gestión de tratamientos", 
            "Inventario básico",
            "Inventario avanzado",
            "Reportes básicos",
            "Reportes avanzados",
            "Facturación",
            "Pagos en línea",
            "Notificaciones SMS",
            "Notificaciones Email",
            "API Access",
            "Integraciones",
            "Soporte 24/7",
            "Backup automático",
            "Múltiples ubicaciones",
            "Personalización avanzada"
          ],
          price: 199.99,
          currency: 'USD',
          billingCycle: 'monthly',
          isActive: true
        }
      ];
      
      // Insertar cada licencia
      for (const license of licenses) {
        console.log(`📝 Insertando ${license.name}...`);
        
        await this.query(`
          INSERT INTO licenses (
            id, name, type, description, maxUsers, maxClients, maxStorage, 
            features, price, currency, billingCycle, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          license.id,
          license.name,
          license.type,
          license.description,
          license.maxUsers,
          license.maxClients,
          license.maxStorage,
          JSON.stringify(license.features),
          license.price,
          license.currency,
          license.billingCycle,
          license.isActive ? 1 : 0
        ]);
        
        console.log(`   ✅ ${license.name} creada correctamente`);
      }
      
      console.log('🎉 Todas las licencias predefinidas han sido insertadas correctamente');
      
      // Verificar inserción
      const insertedLicenses = await this.query('SELECT id, name, type, price FROM licenses ORDER BY type');
      console.log('📋 Resumen de licencias creadas:');
      insertedLicenses.forEach(license => {
        console.log(`   - ${license.name} (${license.type}): $${license.price}`);
      });
      
      return { 
        success: true, 
        message: 'Licencias predefinidas creadas exitosamente', 
        data: insertedLicenses 
      };
      
    } catch (error) {
      console.error('❌ Error en LicenseSeeder:', error);
      throw error;
    }
  }
}

module.exports = LicenseSeeder;
