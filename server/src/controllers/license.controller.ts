import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { generateId } from '../utils/auth';

// Función para obtener características por defecto según tipo de licencia
const getDefaultFeaturesByType = (licenseType: string): string[] => {
  const features = {
    basic: [
      'Gestión de usuarios básica',
      'Gestión de clientes',
      'Gestión de citas',
      'Reportes básicos',
      'Soporte por email'
    ],
    premium: [
      'Gestión de usuarios avanzada',
      'Gestión de clientes',
      'Gestión de citas',
      'Gestión de tratamientos',
      'Inventario básico',
      'Reportes avanzados',
      'Facturación',
      'Notificaciones SMS',
      'Soporte prioritario'
    ],
    enterprise: [
      'Gestión completa de usuarios',
      'Gestión de clientes',
      'Gestión de citas',
      'Gestión de tratamientos',
      'Inventario avanzado',
      'Reportes completos',
      'Facturación avanzada',
      'Pagos en línea',
      'Notificaciones SMS y Email',
      'API Access',
      'Integraciones',
      'Soporte 24/7',
      'Backup automático',
      'Múltiples ubicaciones'
    ]
  };
  
  return features[licenseType as keyof typeof features] || features.basic;
};

// Interface para Licencia (basada en company_licenses)
interface License {
  id: string;
  companyId: string;
  licenseKey: string;
  licenseType: 'basic' | 'premium' | 'enterprise';
  features: string[];
  maxUsers: number;
  maxClients: number;
  maxStorage: number; // En bytes
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Datos de la empresa asociada
  companyName?: string;
  companyEmail?: string;
}

// Obtener todas las licencias
export const getLicenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔄 Obteniendo licencias...');
    
    const { search, type, status } = req.query;
    
    let whereConditions = ['1=1'];
    let params: any[] = [];
    
    // Filtro por búsqueda (buscar en licenseKey o nombre de empresa)
    if (search) {
      whereConditions.push('(cl.licenseKey LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Filtro por tipo
    if (type) {
      whereConditions.push('cl.licenseType = ?');
      params.push(type);
    }
    
    // Filtro por estado
    if (status === 'active') {
      whereConditions.push('cl.isActive = 1');
    } else if (status === 'inactive') {
      whereConditions.push('cl.isActive = 0');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Consulta principal con datos de empresa
    const licensesQuery = `
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      WHERE ${whereClause}
      ORDER BY cl.createdAt DESC
    `;
    
    console.log('📋 Ejecutando consulta de licencias:', licensesQuery);
    console.log('📋 Parámetros:', params);
    
    const licenses = await query(licensesQuery, params);
    
    // Procesar características (JSON string a array) y agregar campos de compatibilidad
    const processedLicenses = licenses.map((license: any) => {
      const storageGB = Math.round((license.maxStorage || 0) / (1024 * 1024 * 1024));
      const isActive = Boolean(license.isActive);
      
      // Calcular precio basado en tipo de licencia
      const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
      const descriptions = {
        basic: 'Plan básico para clínicas pequeñas',
        premium: 'Plan avanzado para clínicas medianas', 
        enterprise: 'Plan completo para grandes organizaciones'
      };
      
      // Calcular ciclo de facturación basado en fechas
      const startDate = new Date(license.startDate);
      const endDate = new Date(license.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
      const billingCycle = daysDiff > 300 ? 'yearly' : 'monthly';
      
      return {
        ...license,
        features: license.features ? JSON.parse(license.features) : [],
        isActive,
        maxStorage: storageGB,
        // Campos de compatibilidad
        name: license.companyName || `Licencia ${license.licenseKey}`,
        type: license.licenseType,
        description: descriptions[license.licenseType as keyof typeof descriptions],
        price: prices[license.licenseType as keyof typeof prices],
        currency: 'USD',
        billingCycle,
        companiesCount: 1, // Siempre 1 para company_licenses
        activeCompaniesCount: isActive ? 1 : 0
      };
    });
    
    console.log('✅ Licencias obtenidas:', processedLicenses.length);
    
    res.json({
      success: true,
      data: processedLicenses,
      message: `${processedLicenses.length} licencia(s) encontrada(s)`
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo licencias:', error);
    return next(error);
  }
};

// Obtener licencia por ID
export const getLicenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Obteniendo licencia por ID:', id);
    
    const licenseQuery = `
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      WHERE cl.id = ?
    `;
    
    const license = await queryOne(licenseQuery, [id]);
    
    if (!license) {
      return res.status(404).json({
        success: false,
        message: 'Licencia no encontrada'
      });
    }
    
    // Procesar características y agregar campos de compatibilidad
    const storageGB = Math.round((license.maxStorage || 0) / (1024 * 1024 * 1024));
    const isActive = Boolean(license.isActive);
    
    // Calcular precio basado en tipo de licencia
    const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
    const descriptions = {
      basic: 'Plan básico para clínicas pequeñas',
      premium: 'Plan avanzado para clínicas medianas', 
      enterprise: 'Plan completo para grandes organizaciones'
    };
    
    // Calcular ciclo de facturación basado en fechas
    const startDate = new Date(license.startDate);
    const endDate = new Date(license.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const billingCycle = daysDiff > 300 ? 'yearly' : 'monthly';
    
    const processedLicense = {
      ...license,
      features: license.features ? JSON.parse(license.features) : [],
      isActive,
      maxStorage: storageGB,
      // Campos de compatibilidad
      name: license.companyName || `Licencia ${license.licenseKey}`,
      type: license.licenseType,
      description: descriptions[license.licenseType as keyof typeof descriptions],
      price: prices[license.licenseType as keyof typeof prices],
      currency: 'USD',
      billingCycle,
      companiesCount: 1,
      activeCompaniesCount: isActive ? 1 : 0
    };
    
    console.log('✅ Licencia encontrada:', processedLicense.licenseKey);
    
    res.json({
      success: true,
      data: processedLicense
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo licencia:', error);
    return next(error);
  }
};

// Crear nueva licencia
export const createLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('➕ Creando nueva licencia para empresa');
    console.log('📋 Datos recibidos:', req.body);

    const { 
      companyId, 
      licenseType = 'basic', 
      maxUsers = 10, 
      maxClients = 100, 
      maxStorage = 5368709120, // 5GB en bytes
      startDate,
      endDate,
      features = []
    } = req.body;

    // Validaciones
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la empresa es requerido'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas de inicio y fin son requeridas'
      });
    }

    // Verificar que la empresa existe
    const company = await queryOne('SELECT id, name FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'La empresa especificada no existe'
      });
    }

    // Verificar que no tenga ya una licencia activa
    const existingLicense = await queryOne(
      'SELECT id FROM company_licenses WHERE companyId = ? AND isActive = 1', 
      [companyId]
    );

    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: 'La empresa ya tiene una licencia activa. Desactive la licencia actual antes de crear una nueva.'
      });
    }

    // Generar ID y clave de licencia únicos
    const licenseId = generateId();
    const licenseKey = `LIC-${company.name.substring(0, 3).toUpperCase()}-${Date.now()}`;

    // Definir características por tipo de licencia
    const defaultFeatures = getDefaultFeaturesByType(licenseType);
    const finalFeatures = features.length > 0 ? features : defaultFeatures;

    // Crear la licencia
    await query(`
      INSERT INTO company_licenses (
        id, companyId, licenseKey, licenseType, features, 
        maxUsers, maxClients, maxStorage, isActive, 
        startDate, endDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
    `, [
      licenseId, companyId, licenseKey, licenseType, JSON.stringify(finalFeatures),
      maxUsers, maxClients, maxStorage, startDate, endDate
    ]);

    console.log(` Licencia creada exitosamente:`);
    console.log(`   - ID: ${licenseId}`);
    console.log(`   - Empresa: ${company.name}`);
    console.log(`   - Clave: ${licenseKey}`);
    console.log(`   - Tipo: ${licenseType}`);
    console.log(`   - Vigencia: ${startDate} - ${endDate}`);

    // Obtener la licencia creada con información de la empresa
    const newLicense = await queryOne(`
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      WHERE cl.id = ?
    `, [licenseId]);

    // Procesar datos para el frontend (usar el mismo procesamiento que getLicenseById)
    const storageGB = Math.round((newLicense.maxStorage || 0) / (1024 * 1024 * 1024));
    const isActive = Boolean(newLicense.isActive);
    
    const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
    const descriptions = {
      basic: 'Plan básico para clínicas pequeñas',
      premium: 'Plan avanzado para clínicas medianas', 
      enterprise: 'Plan completo para grandes organizaciones'
    };
    
    const startDateObj = new Date(newLicense.startDate);
    const endDateObj = new Date(newLicense.endDate);
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));
    const billingCycle = daysDiff > 300 ? 'yearly' : 'monthly';
    
    const processedLicense = {
      ...newLicense,
      features: newLicense.features ? JSON.parse(newLicense.features) : [],
      isActive,
      maxStorage: storageGB,
      name: newLicense.companyName || `Licencia ${newLicense.licenseKey}`,
      type: newLicense.licenseType,
      description: descriptions[newLicense.licenseType as keyof typeof descriptions],
      price: prices[newLicense.licenseType as keyof typeof prices],
      currency: 'USD',
      billingCycle,
      companiesCount: 1,
      activeCompaniesCount: isActive ? 1 : 0
    };

    res.status(201).json({
      success: true,
      message: 'Licencia creada exitosamente',
      data: processedLicense
    });

  } catch (error) {
    console.error('❌ Error al crear licencia:', error);
    return next(error);
  }
};

// Actualizar licencia (funcionalidad limitada para company_licenses)
export const updateLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    console.log('✏️ Actualizando estado de licencia:', id);
    
    // Verificar que la licencia existe
    const existingLicense = await queryOne('SELECT * FROM company_licenses WHERE id = ?', [id]);
    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        message: 'Licencia no encontrada'
      });
    }
    
    // Solo permitir actualizar el estado activo/inactivo
    if (isActive !== undefined) {
      await query('UPDATE company_licenses SET isActive = ?, updatedAt = NOW() WHERE id = ?', [
        isActive ? 1 : 0,
        id
      ]);
      
      console.log('✅ Estado de licencia actualizado:', isActive ? 'Activada' : 'Desactivada');
    }
    
    // Obtener la licencia actualizada con el mismo procesamiento que getLicenseById
    const licenseQuery = `
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      WHERE cl.id = ?
    `;
    
    const license = await queryOne(licenseQuery, [id]);
    
    // Aplicar el mismo procesamiento que en getLicenseById
    const storageGB = Math.round((license.maxStorage || 0) / (1024 * 1024 * 1024));
    const isActiveStatus = Boolean(license.isActive);
    
    const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
    const descriptions = {
      basic: 'Plan básico para clínicas pequeñas',
      premium: 'Plan avanzado para clínicas medianas', 
      enterprise: 'Plan completo para grandes organizaciones'
    };
    
    const startDate = new Date(license.startDate);
    const endDate = new Date(license.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const billingCycle = daysDiff > 300 ? 'yearly' : 'monthly';
    
    const processedLicense = {
      ...license,
      features: license.features ? JSON.parse(license.features) : [],
      isActive: isActiveStatus,
      maxStorage: storageGB,
      name: license.companyName || `Licencia ${license.licenseKey}`,
      type: license.licenseType,
      description: descriptions[license.licenseType as keyof typeof descriptions],
      price: prices[license.licenseType as keyof typeof prices],
      currency: 'USD',
      billingCycle,
      companiesCount: 1,
      activeCompaniesCount: isActiveStatus ? 1 : 0
    };
    
    res.json({
      success: true,
      data: processedLicense,
      message: `Licencia ${processedLicense.name} actualizada correctamente`
    });
    
  } catch (error) {
    console.error('❌ Error actualizando licencia:', error);
    return next(error);
  }
};

// Eliminar licencia (no recomendado para company_licenses)
export const deleteLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Intento de eliminar licencia:', id);
    
    // Verificar que la licencia existe
    const existingLicense = await queryOne('SELECT * FROM company_licenses cl LEFT JOIN companies c ON cl.companyId = c.id WHERE cl.id = ?', [id]);
    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        message: 'Licencia no encontrada'
      });
    }
    
    // Advertir sobre la eliminación de licencias de empresa
    res.status(400).json({
      success: false,
      message: 'No se puede eliminar una licencia asignada a una empresa.',
      info: 'Las licencias de empresa deben ser desactivadas en lugar de eliminadas para mantener el historial.',
      suggestion: 'Use la función de activar/desactivar licencia en su lugar.',
      data: {
        licenseKey: existingLicense.licenseKey,
        companyName: existingLicense.companyName,
        isActive: Boolean(existingLicense.isActive)
      }
    });
    
  } catch (error) {
    console.error('❌ Error en deleteLicense:', error);
    return next(error);
  }
};

// Obtener estadísticas de licencias
export const getLicenseStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📊 Obteniendo estadísticas de licencias...');
    
    // Estadísticas generales de company_licenses
    const totalLicenses = await queryOne('SELECT COUNT(*) as count FROM company_licenses');
    const activeLicenses = await queryOne('SELECT COUNT(*) as count FROM company_licenses WHERE isActive = 1');
    const inactiveLicenses = await queryOne('SELECT COUNT(*) as count FROM company_licenses WHERE isActive = 0');
    
    // Empresas con licencias
    const companiesWithLicenses = await queryOne('SELECT COUNT(DISTINCT companyId) as count FROM company_licenses');
    
    // Estadísticas por tipo de licencia
    const revenueByLicense = await query(`
      SELECT 
        cl.licenseType as type,
        COUNT(cl.id) as licensesCount,
        COUNT(CASE WHEN cl.isActive = 1 THEN 1 END) as activeLicensesCount,
        COUNT(DISTINCT cl.companyId) as companiesCount
      FROM company_licenses cl
      GROUP BY cl.licenseType
      ORDER BY licensesCount DESC
    `);
    
    const stats = {
      totalLicenses: Number(totalLicenses.count) || 0,
      activeLicenses: Number(activeLicenses.count) || 0,
      inactiveLicenses: Number(inactiveLicenses.count) || 0,
      totalCompaniesUsingLicenses: Number(companiesWithLicenses.count) || 0,
      revenueByLicense: revenueByLicense.map((item: any) => {
        const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
        const price = prices[item.type as keyof typeof prices] || 0;
        
        return {
          type: item.type,
          licensesCount: Number(item.licensesCount) || 0,
          activeLicensesCount: Number(item.activeLicensesCount) || 0,
          companiesCount: Number(item.companiesCount) || 0,
          price: price,
          currency: 'USD',
          revenue: price * (Number(item.activeLicensesCount) || 0)
        };
      })
    };
    
    console.log('✅ Estadísticas obtenidas:', stats);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return next(error);
  }
};

// Renovar licencia (extender fechas)
export const renewLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { months = 12 } = req.body; // Por defecto renovar por 12 meses
    
    console.log('🔄 Renovando licencia:', id, 'por', months, 'meses');
    
    // Verificar que la licencia existe
    const existingLicense = await queryOne('SELECT * FROM company_licenses WHERE id = ?', [id]);
    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        message: 'Licencia no encontrada'
      });
    }
    
    // Calcular nueva fecha de fin
    const currentEndDate = new Date(existingLicense.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);
    
    // Actualizar fecha de fin
    await query('UPDATE company_licenses SET endDate = ?, updatedAt = NOW() WHERE id = ?', [
      newEndDate.toISOString().split('T')[0],
      id
    ]);
    
    console.log(`✅ Licencia renovada hasta: ${newEndDate.toISOString().split('T')[0]}`);
    
    // Obtener la licencia actualizada con el mismo procesamiento que getLicenseById
    const licenseQuery = `
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      WHERE cl.id = ?
    `;
    
    const license = await queryOne(licenseQuery, [id]);
    
    // Aplicar el mismo procesamiento que en getLicenseById
    const storageGB = Math.round((license.maxStorage || 0) / (1024 * 1024 * 1024));
    const isActive = Boolean(license.isActive);
    
    const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
    const descriptions = {
      basic: 'Plan básico para clínicas pequeñas',
      premium: 'Plan avanzado para clínicas medianas', 
      enterprise: 'Plan completo para grandes organizaciones'
    };
    
    const startDate = new Date(license.startDate);
    const endDate = new Date(license.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const billingCycle = daysDiff > 300 ? 'yearly' : 'monthly';
    
    const processedLicense = {
      ...license,
      features: license.features ? JSON.parse(license.features) : [],
      isActive,
      maxStorage: storageGB,
      name: license.companyName || `Licencia ${license.licenseKey}`,
      type: license.licenseType,
      description: descriptions[license.licenseType as keyof typeof descriptions],
      price: prices[license.licenseType as keyof typeof prices],
      currency: 'USD',
      billingCycle,
      companiesCount: 1,
      activeCompaniesCount: isActive ? 1 : 0
    };
    
    res.json({
      success: true,
      data: processedLicense,
      message: `Licencia renovada exitosamente por ${months} meses`
    });
    
  } catch (error) {
    console.error('❌ Error renovando licencia:', error);
    return next(error);
  }
};

// Activar/Desactivar licencia
export const toggleLicense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Cambiando estado de licencia:', id);
    
    // Verificar que la licencia existe
    const existingLicense = await queryOne('SELECT * FROM company_licenses WHERE id = ?', [id]);
    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        message: 'Licencia no encontrada'
      });
    }
    
    const newStatus = !existingLicense.isActive;
    
    await query('UPDATE company_licenses SET isActive = ?, updatedAt = NOW() WHERE id = ?', [newStatus ? 1 : 0, id]);
    
    console.log('✅ Estado de licencia cambiado:', newStatus ? 'Activada' : 'Desactivada');
    
    // Obtener la licencia actualizada con el mismo procesamiento que getLicenseById
    const licenseQuery = `
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      WHERE cl.id = ?
    `;
    
    const license = await queryOne(licenseQuery, [id]);
    
    // Aplicar el mismo procesamiento que en getLicenseById
    const storageGB = Math.round((license.maxStorage || 0) / (1024 * 1024 * 1024));
    const isActive = Boolean(license.isActive);
    
    const prices = { basic: 29.99, premium: 79.99, enterprise: 199.99 };
    const descriptions = {
      basic: 'Plan básico para clínicas pequeñas',
      premium: 'Plan avanzado para clínicas medianas', 
      enterprise: 'Plan completo para grandes organizaciones'
    };
    
    const startDate = new Date(license.startDate);
    const endDate = new Date(license.endDate);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    const billingCycle = daysDiff > 300 ? 'yearly' : 'monthly';
    
    const processedLicense = {
      ...license,
      features: license.features ? JSON.parse(license.features) : [],
      isActive,
      maxStorage: storageGB,
      name: license.companyName || `Licencia ${license.licenseKey}`,
      type: license.licenseType,
      description: descriptions[license.licenseType as keyof typeof descriptions],
      price: prices[license.licenseType as keyof typeof prices],
      currency: 'USD',
      billingCycle,
      companiesCount: 1,
      activeCompaniesCount: isActive ? 1 : 0
    };
    
    res.json({
      success: true,
      data: processedLicense,
      message: `Licencia ${processedLicense.name} ${newStatus ? 'activada' : 'desactivada'} correctamente`
    });
    
  } catch (error) {
    console.error('❌ Error cambiando estado de licencia:', error);
    return next(error);
  }
};
