const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Función para generar hash de contraseña
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Función para generar slug único
const generateSlug = (name) => {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Función para generar ID único
const generateId = () => {
  return uuidv4();
};

const multiCompanySeeder = async (connection) => {
  console.log('🚀 Iniciando seeder multi-empresa...');

  try {
    // ==========================================
    // 0. LIMPIAR DATOS EXISTENTES
    // ==========================================
    console.log('🧹 Limpiando datos existentes...');
    
    // Desactivar verificaciones de claves foráneas temporalmente
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      // Limpiar tablas en orden correcto (respetando dependencias)
      console.log('   🗑️ Limpiando pagos...');
      await connection.execute('DELETE FROM payments');
      
      console.log('   🗑️ Limpiando facturas...');
      await connection.execute('DELETE FROM invoices');
      
      console.log('   🗑️ Limpiando tratamientos de citas...');
      await connection.execute('DELETE FROM appointment_treatments');
      
      console.log('   🗑️ Limpiando citas...');
      await connection.execute('DELETE FROM appointments');
      
      console.log('✅ Datos existentes limpiados');
    } catch (error) {
      console.log('   ⚠️ Algunas tablas no existen o ya están vacías:', error.message);
    }
    
    // Reactivar verificaciones de claves foráneas
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // ==========================================
    // 1. CREAR USUARIO MASTER
    // ==========================================
    console.log('👑 Creando usuario master...');
    
    const masterUserId = uuidv4();
    const masterPassword = await hashPassword('Master123!');
    
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, isMaster, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        isMaster = VALUES(isMaster),
        updatedAt = NOW()
    `, [
      masterUserId,
      'master@sistema.com',
      masterPassword,
      'Usuario',
      'Master',
      '+1-555-0000',
      true,
      true
    ]);

    console.log('✅ Usuario master creado: master@sistema.com / Master123!');

    // ==========================================
    // 1.5. CREAR ROLES Y ASIGNAR AL MASTER
    // ==========================================
    console.log('🎭 Creando roles...');

    // Crear roles básicos
    const masterRoleId = 'master-role-id';
    const adminRoleId = 'admin-role-id';
    const employeeRoleId = 'employee-role-id';
    const clientRoleId = 'client-role-id';

    const roles = [
      {
        id: masterRoleId,
        name: 'master',
        description: 'Usuario Master con acceso completo al sistema',
        permissions: JSON.stringify({
          companies: ['create', 'read', 'update', 'delete'],
          users: ['create', 'read', 'update', 'delete'],
          employees: ['create', 'read', 'update', 'delete'],
          clients: ['create', 'read', 'update', 'delete'],
          appointments: ['create', 'read', 'update', 'delete'],
          treatments: ['create', 'read', 'update', 'delete'],
          reports: ['read'],
          settings: ['read', 'update']
        })
      },
      {
        id: adminRoleId,
        name: 'administrador',
        description: 'Administrador de empresa con permisos de gestión',
        permissions: JSON.stringify({
          employees: ['create', 'read', 'update', 'delete'],
          clients: ['create', 'read', 'update', 'delete'],
          appointments: ['create', 'read', 'update', 'delete'],
          treatments: ['create', 'read', 'update', 'delete'],
          reports: ['read'],
          settings: ['read', 'update']
        })
      },
      {
        id: employeeRoleId,
        name: 'empleado',
        description: 'Empleado con permisos operativos básicos',
        permissions: JSON.stringify({
          clients: ['create', 'read', 'update'],
          appointments: ['create', 'read', 'update'],
          treatments: ['read'],
          inventory: ['read', 'update']
        })
      },
      {
        id: clientRoleId,
        name: 'cliente',
        description: 'Cliente con acceso limitado a sus datos',
        permissions: JSON.stringify({
          appointments: ['read'],
          treatments: ['read'],
          profile: ['read', 'update']
        })
      }
    ];

    for (const role of roles) {
      await connection.execute(`
        INSERT INTO roles (id, name, description, permissions, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          permissions = VALUES(permissions),
          updatedAt = NOW()
      `, [role.id, role.name, role.description, role.permissions]);
    }

    // Asignar rol master al usuario master
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        updatedAt = NOW()
    `, [generateId(), masterUserId, masterRoleId]);

    console.log('✅ Roles creados y asignados al usuario master');

    // ==========================================
    // 2. CREAR EMPRESAS
    // ==========================================
    console.log('🏢 Creando empresas...');

    // Empresa 1: Clínica Estética Bella
    const company1Id = uuidv4();
    await connection.execute(`
      INSERT INTO companies (id, name, slug, email, phone, address, website, isActive, licenseType, maxUsers, maxClients, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      company1Id,
      'Clínica Estética Bella',
      'clinica-estetica-bella',
      'contacto@clinicabella.com',
      '+1-555-1001',
      '123 Avenida Principal, Ciudad, País',
      'https://www.clinicabella.com',
      true,
      'premium',
      25,
      500
    ]);

    // Empresa 2: Centro de Bienestar Vida
    const company2Id = uuidv4();
    await connection.execute(`
      INSERT INTO companies (id, name, slug, email, phone, address, website, isActive, licenseType, maxUsers, maxClients, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      company2Id,
      'Centro de Bienestar Vida',
      'centro-bienestar-vida',
      'info@centrovida.com',
      '+1-555-2001',
      '456 Calle Salud, Zona Norte, País',
      'https://www.centrovida.com',
      true,
      'basic',
      15,
      200
    ]);

    console.log('✅ Empresas creadas:');
    console.log('   - Clínica Estética Bella (Premium)');
    console.log('   - Centro de Bienestar Vida (Basic)');

    // ==========================================
    // 3. CONFIGURACIÓN DE EMPRESAS
    // ==========================================
    console.log('⚙️ Configurando empresas...');

    // Configuración Empresa 1 (Tema Púrpura)
    await connection.execute(`
      INSERT INTO company_settings (id, companyId, primaryColor, secondaryColor, accentColor, theme, timezone, dateFormat, currency, language, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      company1Id,
      '#8B5CF6', // Púrpura
      '#A78BFA',
      '#C4B5FD',
      'light',
      'America/New_York',
      'DD/MM/YYYY',
      'USD',
      'es'
    ]);

    // Configuración Empresa 2 (Tema Azul)
    await connection.execute(`
      INSERT INTO company_settings (id, companyId, primaryColor, secondaryColor, accentColor, theme, timezone, dateFormat, currency, language, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      company2Id,
      '#3B82F6', // Azul
      '#60A5FA',
      '#93C5FD',
      'light',
      'America/New_York',
      'DD/MM/YYYY',
      'USD',
      'es'
    ]);

    console.log('✅ Configuraciones de empresa creadas');

    // ==========================================
    // 4. CREAR USUARIOS POR EMPRESA
    // ==========================================
    console.log('👥 Creando usuarios por empresa...');

    // EMPRESA 1: Clínica Estética Bella
    console.log('   📋 Empresa 1: Clínica Estética Bella');

    // Admin Empresa 1
    const admin1Id = uuidv4();
    const admin1Password = await hashPassword('Admin123!');
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      admin1Id,
      'admin@clinicabella.com',
      admin1Password,
      'María',
      'González',
      '+1-555-1101',
      true,
      company1Id
    ]);

    // Empleados Empresa 1
    const employee1_1Id = uuidv4();
    const employee1_1Password = await hashPassword('Empleado123');
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      employee1_1Id,
      'ana.martinez@clinicabella.com',
      employee1_1Password,
      'Ana',
      'Martínez',
      '+1-555-1102',
      true,
      company1Id
    ]);

    const employee1_2Id = uuidv4();
    const employee1_2Password = await hashPassword('Empleado123');
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      employee1_2Id,
      'carlos.rodriguez@clinicabella.com',
      employee1_2Password,
      'Carlos',
      'Rodríguez',
      '+1-555-1103',
      true,
      company1Id
    ]);

    // EMPRESA 2: Centro de Bienestar Vida
    console.log('   📋 Empresa 2: Centro de Bienestar Vida');

    // Admin Empresa 2
    const admin2Id = uuidv4();
    const admin2Password = await hashPassword('Admin123!');
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      admin2Id,
      'admin@centrovida.com',
      admin2Password,
      'Roberto',
      'Silva',
      '+1-555-2101',
      true,
      company2Id
    ]);

    // Empleados Empresa 2
    const employee2_1Id = uuidv4();
    const employee2_1Password = await hashPassword('Empleado123');
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      employee2_1Id,
      'lucia.fernandez@centrovida.com',
      employee2_1Password,
      'Lucía',
      'Fernández',
      '+1-555-2102',
      true,
      company2Id
    ]);

    const employee2_2Id = uuidv4();
    const employee2_2Password = await hashPassword('Empleado123');
    await connection.execute(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      employee2_2Id,
      'diego.morales@centrovida.com',
      employee2_2Password,
      'Diego',
      'Morales',
      '+1-555-2103',
      true,
      company2Id
    ]);

    console.log('✅ Usuarios creados por empresa');

    // ==========================================
    // 4.5. ASIGNAR ROLES A USUARIOS
    // ==========================================
    console.log('🎭 Asignando roles a usuarios...');

    // Asignar rol administrador a admin1
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [generateId(), admin1Id, adminRoleId]);

    // Asignar rol administrador a admin2
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [generateId(), admin2Id, adminRoleId]);

    // Asignar rol empleado a employee1_1
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [generateId(), employee1_1Id, employeeRoleId]);

    // Asignar rol empleado a employee1_2
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [generateId(), employee1_2Id, employeeRoleId]);

    // Asignar rol empleado a employee2_1
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [generateId(), employee2_1Id, employeeRoleId]);

    // Asignar rol empleado a employee2_2
    await connection.execute(`
      INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
      VALUES (?, ?, ?, NOW(), NOW())
    `, [generateId(), employee2_2Id, employeeRoleId]);

    console.log('✅ Roles asignados a todos los usuarios');

    // ==========================================
    // 5. ASIGNAR RELACIONES USER_COMPANIES
    // ==========================================
    console.log('🔗 Asignando relaciones usuario-empresa...');

    // Usuario Master - Acceso a ambas empresas
    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), masterUserId, company1Id, 'master', true]);

    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), masterUserId, company2Id, 'master', true]);

    // Empresa 1 - Relaciones
    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), admin1Id, company1Id, 'admin', true]);

    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), employee1_1Id, company1Id, 'employee', true]);

    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), employee1_2Id, company1Id, 'employee', true]);

    // Empresa 2 - Relaciones
    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), admin2Id, company2Id, 'admin', true]);

    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), employee2_1Id, company2Id, 'employee', true]);

    await connection.execute(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), employee2_2Id, company2Id, 'employee', true]);

    console.log('✅ Relaciones usuario-empresa asignadas');

    // ==========================================
    // 6. CREAR CLIENTES PARA CADA EMPRESA
    // ==========================================
    console.log('👤 Creando clientes para cada empresa...');

    // Clientes para Empresa 1
    const clientsCompany1 = [
      { firstName: 'Isabella', lastName: 'López', email: 'isabella.lopez@email.com', phone: '+1-555-3001' },
      { firstName: 'Sofía', lastName: 'Ramírez', email: 'sofia.ramirez@email.com', phone: '+1-555-3002' },
      { firstName: 'Valentina', lastName: 'Torres', email: 'valentina.torres@email.com', phone: '+1-555-3003' },
      { firstName: 'Camila', lastName: 'Flores', email: 'camila.flores@email.com', phone: '+1-555-3004' },
      { firstName: 'Natalia', lastName: 'Herrera', email: 'natalia.herrera@email.com', phone: '+1-555-3005' },
      { firstName: 'Andrea', lastName: 'Castillo', email: 'andrea.castillo@email.com', phone: '+1-555-3006' }
    ];

    for (const client of clientsCompany1) {
      const clientUserId = uuidv4();
      const clientPassword = await hashPassword('Cliente123');
      
      // Crear usuario
      await connection.execute(`
        INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        clientUserId,
        client.email,
        clientPassword,
        client.firstName,
        client.lastName,
        client.phone,
        true,
        company1Id
      ]);

      // Crear cliente
      await connection.execute(`
        INSERT INTO clients (id, userId, companyId, clientCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [
        uuidv4(),
        clientUserId,
        company1Id,
        `CB${Date.now().toString().slice(-6)}`
      ]);

      // Asignar relación usuario-empresa
      await connection.execute(`
        INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [uuidv4(), clientUserId, company1Id, 'client', true]);
    }

    // Clientes para Empresa 2
    const clientsCompany2 = [
      { firstName: 'Alejandro', lastName: 'Vargas', email: 'alejandro.vargas@email.com', phone: '+1-555-4001' },
      { firstName: 'Sebastián', lastName: 'Mendoza', email: 'sebastian.mendoza@email.com', phone: '+1-555-4002' },
      { firstName: 'Mateo', lastName: 'Jiménez', email: 'mateo.jimenez@email.com', phone: '+1-555-4003' },
      { firstName: 'Daniel', lastName: 'Ruiz', email: 'daniel.ruiz@email.com', phone: '+1-555-4004' },
      { firstName: 'Santiago', lastName: 'Ortega', email: 'santiago.ortega@email.com', phone: '+1-555-4005' },
      { firstName: 'Nicolás', lastName: 'Peña', email: 'nicolas.pena@email.com', phone: '+1-555-4006' }
    ];

    for (const client of clientsCompany2) {
      const clientUserId = uuidv4();
      const clientPassword = await hashPassword('Cliente123');
      
      // Crear usuario
      await connection.execute(`
        INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        clientUserId,
        client.email,
        clientPassword,
        client.firstName,
        client.lastName,
        client.phone,
        true,
        company2Id
      ]);

      // Crear cliente
      await connection.execute(`
        INSERT INTO clients (id, userId, companyId, clientCode, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [
        uuidv4(),
        clientUserId,
        company2Id,
        `CV${Date.now().toString().slice(-6)}`
      ]);

      // Asignar relación usuario-empresa
      await connection.execute(`
        INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [uuidv4(), clientUserId, company2Id, 'client', true]);
    }

    console.log('✅ Clientes creados (6 por empresa)');

    // ==========================================
    // 7. CREAR EMPLEADOS EN TABLA EMPLOYEES
    // ==========================================
    console.log('👨‍💼 Creando registros de empleados...');

    // Empleados Empresa 1
    const employeeRecord1_1Id = uuidv4(); // ID del registro de empleado (no del usuario)
    await connection.execute(`
      INSERT INTO employees (id, userId, companyId, position, salary, hireDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      admin1Id,
      company1Id,
      'Administradora General',
      75000.00,
      '2023-01-15'
    ]);

    await connection.execute(`
      INSERT INTO employees (id, userId, companyId, position, salary, hireDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      employeeRecord1_1Id,
      employee1_1Id,
      company1Id,
      'Esteticista Senior',
      45000.00,
      '2023-03-01'
    ]);

    const employeeRecord1_2Id = uuidv4(); // ID del registro de empleado (no del usuario)
    await connection.execute(`
      INSERT INTO employees (id, userId, companyId, position, salary, hireDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      employeeRecord1_2Id,
      employee1_2Id,
      company1Id,
      'Terapeuta de Masajes',
      40000.00,
      '2023-05-15'
    ]);

    // Empleados Empresa 2
    await connection.execute(`
      INSERT INTO employees (id, userId, companyId, position, salary, hireDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      admin2Id,
      company2Id,
      'Director de Centro',
      70000.00,
      '2023-02-01'
    ]);

    await connection.execute(`
      INSERT INTO employees (id, userId, companyId, position, salary, hireDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      employee2_1Id,
      company2Id,
      'Nutricionista',
      50000.00,
      '2023-04-01'
    ]);

    await connection.execute(`
      INSERT INTO employees (id, userId, companyId, position, salary, hireDate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      uuidv4(),
      employee2_2Id,
      company2Id,
      'Entrenador Personal',
      42000.00,
      '2023-06-01'
    ]);

    console.log('✅ Registros de empleados creados');

    // ==========================================
    // 8. ASIGNAR COMPANYID A REGISTROS EXISTENTES
    // ==========================================
    console.log('🔄 Asignando companyId a registros existentes...');

    // Obtener el primer usuario existente (que no sea master)
    const [existingUsers] = await connection.execute(`
      SELECT id FROM users WHERE isMaster = FALSE AND currentCompanyId IS NULL LIMIT 1
    `);

    if (existingUsers.length > 0) {
      const existingUserId = existingUsers[0].id;
      
      // Asignar a la primera empresa
      await connection.execute(`
        UPDATE users SET currentCompanyId = ? WHERE id = ?
      `, [company1Id, existingUserId]);

      // Crear relación usuario-empresa
      await connection.execute(`
        INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE updatedAt = NOW()
      `, [uuidv4(), existingUserId, company1Id, 'admin', true]);

      // Asignar companyId a registros existentes en otras tablas
      await connection.execute(`
        UPDATE clients SET companyId = ? WHERE companyId IS NULL
      `, [company1Id]);

      await connection.execute(`
        UPDATE employees SET companyId = ? WHERE companyId IS NULL
      `, [company1Id]);

      // Si existen tablas treatments y appointments
      try {
        await connection.execute(`
          UPDATE treatments SET companyId = ? WHERE companyId IS NULL
        `, [company1Id]);
      } catch (error) {
        console.log('   ⚠️ Tabla treatments no existe o está vacía');
      }

      try {
        await connection.execute(`
          UPDATE appointments SET companyId = ? WHERE companyId IS NULL
        `, [company1Id]);
      } catch (error) {
        console.log('   ⚠️ Tabla appointments no existe o está vacía');
      }

      console.log('✅ CompanyId asignado a registros existentes');
    }

    // ==========================================
    // 6. CREAR DATOS DE PRUEBA
    // ==========================================
    console.log('\n📊 Creando datos de prueba...');

    // ==========================================
    // 6.1. CREAR TRATAMIENTOS
    // ==========================================
    console.log('💊 Creando tratamientos...');

    const treatments = [
      // Empresa 1 - Clínica Estética Bella (5 tratamientos)
      {
        id: uuidv4(),
        companyId: company1Id,
        name: 'Jalupro Classic',
        description: 'Tratamiento de biorevitalización con ácido hialurónico',
        duration: 30,
        price: 220.00,
        category: 'Facial',
        isActive: true
      },
      {
        id: uuidv4(),
        companyId: company1Id,
        name: 'Hidrafacial Coreano',
        description: 'Limpieza facial profunda con tecnología coreana',
        duration: 60,
        price: 65.00,
        category: 'Facial',
        isActive: true
      },
      {
        id: uuidv4(),
        companyId: company1Id,
        name: 'Masaje Corporal/Linfático',
        description: 'Masaje relajante y drenaje linfático',
        duration: 90,
        price: 70.00,
        category: 'Corporal',
        isActive: true
      },
      {
        id: uuidv4(),
        companyId: company1Id,
        name: 'Botox Facial',
        description: 'Aplicación de toxina botulínica para arrugas de expresión',
        duration: 45,
        price: 350.00,
        category: 'Facial',
        isActive: true
      },
      {
        id: uuidv4(),
        companyId: company1Id,
        name: 'Radiofrecuencia Corporal',
        description: 'Tratamiento reafirmante con radiofrecuencia',
        duration: 75,
        price: 180.00,
        category: 'Corporal',
        isActive: true
      }
    ];

    for (const treatment of treatments) {
      await connection.execute(`
        INSERT INTO treatments (id, companyId, name, description, duration, price, category, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        treatment.id,
        treatment.companyId,
        treatment.name,
        treatment.description,
        treatment.duration,
        treatment.price,
        treatment.category,
        treatment.isActive
      ]);
    }

    console.log(`✅ ${treatments.length} tratamientos creados`);

    // ==========================================
    // 6.2. CREAR INSUMOS/INVENTARIO
    // ==========================================
    console.log('📦 Creando inventario...');

    const supplies = [
      {
        id: uuidv4(),
        name: 'Ácido Hialurónico 2ml',
        description: 'Vial de ácido hialurónico para tratamientos faciales',
        category: 'Insumos Médicos',
        unit: 'vial',
        stock: 25,
        minStock: 5,
        maxStock: 50,
        unitCost: 45.00,
        supplier: 'MedSupply Corp',
        status: 'ACTIVE'
      },
      {
        id: uuidv4(),
        name: 'Guantes Nitrilo',
        description: 'Guantes desechables de nitrilo talla M',
        category: 'Material Médico',
        unit: 'caja',
        stock: 15,
        minStock: 5,
        maxStock: 30,
        unitCost: 12.50,
        supplier: 'Medical Supplies Inc',
        status: 'ACTIVE'
      },
      {
        id: uuidv4(),
        name: 'Toxina Botulínica 100U',
        description: 'Vial de toxina botulínica para tratamientos estéticos',
        category: 'Medicamentos',
        unit: 'vial',
        stock: 8,
        minStock: 2,
        maxStock: 15,
        unitCost: 280.00,
        supplier: 'Pharma Aesthetics',
        status: 'ACTIVE'
      },
      {
        id: uuidv4(),
        name: 'Crema Anestésica Tópica',
        description: 'Crema anestésica para procedimientos estéticos',
        category: 'Cosméticos',
        unit: 'tubo',
        stock: 12,
        minStock: 3,
        maxStock: 20,
        unitCost: 18.75,
        supplier: 'Beauty Care Ltd',
        status: 'ACTIVE'
      }
    ];

    for (const supply of supplies) {
      await connection.execute(`
        INSERT INTO supplies (id, name, description, category, unit, stock, minStock, maxStock, unitCost, supplier, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        supply.id,
        supply.name,
        supply.description,
        supply.category,
        supply.unit,
        supply.stock,
        supply.minStock,
        supply.maxStock,
        supply.unitCost,
        supply.supplier,
        supply.status
      ]);
    }

    console.log(`✅ ${supplies.length} insumos creados`);

    // ==========================================
    // 6.3. CREAR CLIENTES (8 clientes)
    // ==========================================
    console.log('👥 Creando clientes...');

    const clientsData = [
      {
        firstName: 'Patricia',
        lastName: 'Fernandez',
        email: 'patricia.fernandez@email.com',
        phone: '+58-424-7856456',
        dateOfBirth: '1985-03-15',
        age: 39,
        gender: 'F',
        address: 'Av. Principal, Caracas, Venezuela',
        emergencyContact: 'María Fernandez - +58-412-1234567'
      },
      {
        firstName: 'Nicolás',
        lastName: 'Peña',
        email: 'nicolas.pena@email.com',
        phone: '+58-414-9876543',
        dateOfBirth: '1990-07-22',
        age: 34,
        gender: 'M',
        address: 'Calle 5, Maracaibo, Venezuela',
        emergencyContact: 'Ana Peña - +58-416-7654321'
      },
      {
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@email.com',
        phone: '+58-412-5555555',
        dateOfBirth: '1992-11-08',
        age: 32,
        gender: 'F',
        address: 'Urbanización Los Palos Grandes, Caracas',
        emergencyContact: 'Carlos González - +58-414-1111111'
      },
      {
        firstName: 'Carmen',
        lastName: 'López',
        email: 'carmen.lopez@email.com',
        phone: '+58-426-7777777',
        dateOfBirth: '1988-05-20',
        age: 36,
        gender: 'F',
        address: 'Centro Comercial Sambil, Valencia',
        emergencyContact: 'Luis López - +58-424-2222222'
      },
      {
        firstName: 'Alisson',
        lastName: 'Gomez',
        email: 'alisson.gomez@email.com',
        phone: '+58-416-3333333',
        dateOfBirth: '1995-01-12',
        age: 29,
        gender: 'F',
        address: 'Barquisimeto, Estado Lara',
        emergencyContact: 'Pedro Gomez - +58-414-4444444'
      },
      {
        firstName: 'Roberto',
        lastName: 'Martínez',
        email: 'roberto.martinez@email.com',
        phone: '+58-424-8888888',
        dateOfBirth: '1983-09-30',
        age: 41,
        gender: 'M',
        address: 'Maracay, Estado Aragua',
        emergencyContact: 'Elena Martínez - +58-412-9999999'
      },
      {
        firstName: 'Sofía',
        lastName: 'Rodríguez',
        email: 'sofia.rodriguez@email.com',
        phone: '+58-414-6666666',
        dateOfBirth: '1991-12-03',
        age: 33,
        gender: 'F',
        address: 'Puerto Ordaz, Estado Bolívar',
        emergencyContact: 'Miguel Rodríguez - +58-426-5555555'
      },
      {
        firstName: 'Carlos',
        lastName: 'Herrera',
        email: 'carlos.herrera@email.com',
        phone: '+58-416-1010101',
        dateOfBirth: '1987-04-18',
        age: 37,
        gender: 'M',
        address: 'Mérida, Estado Mérida',
        emergencyContact: 'Ana Herrera - +58-424-1212121'
      }
    ];

    const clientUserIds = [];

    for (let i = 0; i < clientsData.length; i++) {
      const clientData = clientsData[i];
      let clientUserId = uuidv4();
      const clientPassword = await hashPassword('Cliente123');
      
      // Verificar si el usuario ya existe
      const [existingUser] = await connection.execute(`
        SELECT id FROM users WHERE email = ?
      `, [clientData.email]);
      
      if (existingUser.length > 0) {
        clientUserId = existingUser[0].id;
        // Actualizar usuario existente
        await connection.execute(`
          UPDATE users SET 
            firstName = ?, lastName = ?, phone = ?, currentCompanyId = ?, updatedAt = NOW()
          WHERE id = ?
        `, [clientData.firstName, clientData.lastName, clientData.phone, company1Id, clientUserId]);
      } else {
        // Crear nuevo usuario
        await connection.execute(`
          INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          clientUserId,
          clientData.email,
          clientPassword,
          clientData.firstName,
          clientData.lastName,
          clientData.phone,
          true,
          company1Id
        ]);
      }

      const clientId = uuidv4();
      await connection.execute(`
        INSERT INTO clients (id, userId, companyId, clientCode, dateOfBirth, age, gender, address, emergencyContact, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          clientCode = VALUES(clientCode),
          dateOfBirth = VALUES(dateOfBirth),
          age = VALUES(age),
          gender = VALUES(gender),
          address = VALUES(address),
          emergencyContact = VALUES(emergencyContact),
          updatedAt = NOW()
      `, [
        clientId,
        clientUserId,
        company1Id,
        `CL${String(i + 1).padStart(8, '0')}XXM`,
        clientData.dateOfBirth,
        clientData.age,
        clientData.gender,
        clientData.address,
        clientData.emergencyContact
      ]);

      clientUserIds.push(clientUserId);
    }

    // Asignar roles y relaciones para todos los clientes
    for (const clientUserId of clientUserIds) {
      await connection.execute(`
        INSERT INTO user_roles (id, userId, roleId, createdAt, updatedAt)
        VALUES (?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE updatedAt = NOW()
      `, [generateId(), clientUserId, clientRoleId]);

      await connection.execute(`
        INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          role = VALUES(role),
          isActive = VALUES(isActive),
          updatedAt = NOW()
      `, [uuidv4(), clientUserId, company1Id, 'client', true]);
    }

    console.log(`✅ ${clientsData.length} clientes creados`);

    console.log('✅ Datos de prueba creados exitosamente');

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n🎉 ¡Seeder multi-empresa completado exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log('=====================================');
    console.log('👑 USUARIO MASTER:');
    console.log('   Email: master@sistema.com');
    console.log('   Password: Master123!');
    console.log('   Acceso: Todas las empresas');
    console.log('');
    console.log('🏢 EMPRESA 1: Clínica Estética Bella');
    console.log('   Admin: admin@clinicabella.com / Admin123!');
    console.log('   Empleados: 3 empleados creados');
    console.log('     - ana.martinez@clinicabella.com / Empleado123');
    console.log('     - carlos.rodriguez@clinicabella.com / Empleado123');
    console.log('   Clientes: 8 clientes creados');
    console.log('     - patricia.fernandez@email.com / Cliente123');
    console.log('     - maria.gonzalez@email.com / Cliente123');
    console.log('     - carmen.lopez@email.com / Cliente123');
    console.log('     - alisson.gomez@email.com / Cliente123');
    console.log('     - roberto.martinez@email.com / Cliente123');
    console.log('     - sofia.rodriguez@email.com / Cliente123');
    console.log('     - carlos.herrera@email.com / Cliente123');
    console.log('     - nicolas.pena@email.com / Cliente123');
    console.log('   Tratamientos: 5 creados (Jalupro, Hidrafacial, Masaje, Botox, Radiofrecuencia)');
    console.log('   Inventario: 4 insumos creados');
    console.log('   Tema: Púrpura (#8B5CF6)');
    console.log('');
    console.log('🏢 EMPRESA 2: Centro de Bienestar Vida');
    console.log('   Admin: admin@centrovida.com / Admin123!');
    console.log('   Empleados: 3 empleados creados');
    console.log('     - lucia.fernandez@centrovida.com / Empleado123');
    console.log('     - diego.morales@centrovida.com / Empleado123');
    console.log('   Clientes: 6 usuarios creados (heredados del sistema anterior)');
    console.log('   Tema: Azul (#3B82F6)');
    console.log('=====================================');

    return {
      success: true,
      companies: [
        { id: company1Id, name: 'Clínica Estética Bella' },
        { id: company2Id, name: 'Centro de Bienestar Vida' }
      ],
      masterUserId,
      message: 'Seeder multi-empresa ejecutado exitosamente'
    };

  } catch (error) {
    console.error('❌ Error en seeder multi-empresa:', error);
    throw error;
  }
};

module.exports = multiCompanySeeder;
