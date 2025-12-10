import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { v4 as generateId } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { checkCompanyLicense } from '../middleware/licenseValidation';

// Interfaces para las nuevas tablas
interface LicenseTemplate {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string;
  maxUsers: number;
  maxClients: number;
  maxStorage: number;
  features: string[];
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompanyLicense {
  id: string;
  companyId: string;
  licenseId: string;
  licenseKey: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Datos relacionados
  companyName?: string;
  licenseName?: string;
  licenseType?: string;
  maxUsers?: number;
  maxClients?: number;
  maxStorage?: number;
  features?: string[];
  price?: number;
}

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
    
    // Consulta principal con datos de empresa y plantilla (columnas básicas)
    const licensesQuery = `
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail,
        l.name as licenseName,
        l.type as licenseType,
        l.description as licenseDescription,
        l.features as templateFeatures,
        l.price as licensePrice,
        l.currency as licenseCurrency,
        l.billingCycle as licenseBillingCycle
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      LEFT JOIN licenses l ON cl.licenseId = l.id
      WHERE ${whereClause}
      ORDER BY cl.createdAt DESC
    `;
    
    console.log('📋 Ejecutando consulta de licencias:', licensesQuery);
    console.log('📋 Parámetros:', params);
    
    const licenses = await query(licensesQuery, params);
    
    // Procesar características (JSON string a array) y agregar campos de compatibilidad
    const processedLicenses = licenses.map((license: any) => {
      const isActive = Boolean(license.isActive);
      
      // Valores por defecto basados en el tipo de licencia
      const getDefaultValuesByType = (type: string) => {
        switch (type) {
          case 'basic':
            return { maxUsers: 10, maxClients: 100, maxStorage: 5 }; // 5GB
          case 'premium':
            return { maxUsers: 50, maxClients: 500, maxStorage: 25 }; // 25GB
          case 'enterprise':
            return { maxUsers: -1, maxClients: -1, maxStorage: 100 }; // 100GB, -1 = ilimitado
          default:
            return { maxUsers: 10, maxClients: 100, maxStorage: 5 };
        }
      };
      
      const defaults = getDefaultValuesByType(license.licenseType || 'basic');
      
      return {
        ...license,
        // Datos de la licencia asignada
        id: license.id,
        companyId: license.companyId,
        licenseId: license.licenseId,
        licenseKey: license.licenseKey,
        isActive,
        startDate: license.startDate,
        endDate: license.endDate,
        
        // Datos de la plantilla (con valores por defecto)
        features: license.templateFeatures ? JSON.parse(license.templateFeatures) : [],
        maxUsers: defaults.maxUsers,
        maxClients: defaults.maxClients,
        maxStorage: defaults.maxStorage,
        name: license.licenseName || `Licencia ${license.licenseKey}`,
        type: license.licenseType || 'basic',
        description: license.licenseDescription || `Plan ${license.licenseType || 'básico'}`,
        price: license.licensePrice || 0,
        currency: license.licenseCurrency || 'USD',
        billingCycle: license.licenseBillingCycle || 'monthly',
        
        // Datos de la empresa
        companyName: license.companyName || 'Empresa no encontrada',
        companyEmail: license.companyEmail || 'Sin email',
        
        // Metadatos
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

    // Buscar la plantilla de licencia por tipo
    const licenseTemplate = await queryOne('SELECT * FROM licenses WHERE type = ? AND isActive = 1', [licenseType]);
    if (!licenseTemplate) {
      return res.status(404).json({
        success: false,
        message: `No se encontró una plantilla de licencia activa para el tipo: ${licenseType}`
      });
    }

    console.log('📄 Plantilla encontrada:', licenseTemplate.name, '- ID:', licenseTemplate.id);

    // Verificar que no tenga ya una licencia vigente (activa y no expirada)
    const existingLicense = await queryOne(`
      SELECT id, licenseKey, startDate, endDate, isActive 
      FROM company_licenses 
      WHERE companyId = ? AND isActive = 1 AND endDate >= CURDATE()
    `, [companyId]);

    if (existingLicense) {
      const daysRemaining = Math.ceil((new Date(existingLicense.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('⚠️ Empresa ya tiene licencia vigente:', {
        licenseId: existingLicense.id,
        licenseKey: existingLicense.licenseKey,
        endDate: existingLicense.endDate,
        daysRemaining: daysRemaining
      });
      
      return res.status(400).json({
        success: false,
        message: `La empresa ya tiene una licencia vigente que expira el ${new Date(existingLicense.endDate).toLocaleDateString('es-ES')} (${daysRemaining} días restantes). No se puede crear una nueva licencia hasta que la actual expire.`,
        data: {
          existingLicense: {
            id: existingLicense.id,
            licenseKey: existingLicense.licenseKey,
            endDate: existingLicense.endDate,
            daysRemaining: daysRemaining
          }
        }
      });
    }

    // Verificar si tiene licencias expiradas para mostrar información
    const expiredLicenses = await query(`
      SELECT id, licenseKey, endDate 
      FROM company_licenses 
      WHERE companyId = ? AND (isActive = 0 OR endDate < CURDATE())
      ORDER BY endDate DESC
    `, [companyId]);

    if (expiredLicenses.length > 0) {
      console.log('📋 Empresa tiene licencias expiradas/inactivas:', {
        count: expiredLicenses.length,
        lastExpired: expiredLicenses[0].endDate
      });
    }

    // Generar ID y clave de licencia únicos
    const companyLicenseId = generateId();
    const licenseKey = `LIC-${company.name.substring(0, 3).toUpperCase()}-${Date.now()}`;

    // Usar características de la plantilla o las proporcionadas
    const templateFeatures = licenseTemplate.features ? JSON.parse(licenseTemplate.features) : [];
    const finalFeatures = features.length > 0 ? features : templateFeatures;
    
    // Usar límites de la plantilla o los proporcionados
    const finalMaxUsers = maxUsers || licenseTemplate.maxUsers || 10;
    const finalMaxClients = maxClients || licenseTemplate.maxClients || 100;
    const finalMaxStorage = maxStorage || licenseTemplate.maxStorage || 5368709120;

    console.log('📋 Datos finales para la licencia:');
    console.log('   - Plantilla ID:', licenseTemplate.id);
    console.log('   - Max Users:', finalMaxUsers);
    console.log('   - Max Clients:', finalMaxClients);
    console.log('   - Features:', finalFeatures);

    // Crear la licencia (estructura básica de company_licenses)
    await query(`
      INSERT INTO company_licenses (
        id, companyId, licenseId, licenseKey, 
        isActive, startDate, endDate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW())
    `, [
      companyLicenseId, companyId, licenseTemplate.id, licenseKey, startDate, endDate
    ]);

    console.log(`✅ Licencia creada exitosamente:`);
    console.log(`   - ID: ${companyLicenseId}`);
    console.log(`   - Empresa: ${company.name}`);
    console.log(`   - Clave: ${licenseKey}`);
    console.log(`   - Tipo: ${licenseType}`);
    console.log(`   - Plantilla: ${licenseTemplate.name}`);
    console.log(`   - Vigencia: ${startDate} - ${endDate}`);

    // Obtener la licencia creada con información de la empresa y plantilla
    const newLicense = await queryOne(`
      SELECT 
        cl.*,
        c.name as companyName,
        c.email as companyEmail,
        l.name as licenseName,
        l.type as licenseType,
        l.price as licensePrice,
        l.currency as licenseCurrency,
        l.billingCycle as licenseBillingCycle
      FROM company_licenses cl
      LEFT JOIN companies c ON cl.companyId = c.id
      LEFT JOIN licenses l ON cl.licenseId = l.id
      WHERE cl.id = ?
    `, [companyLicenseId]);

    // Procesar datos para el frontend usando información de la plantilla
    const storageGB = Math.round((licenseTemplate.maxStorage || 5368709120) / (1024 * 1024 * 1024));
    const isActive = Boolean(newLicense.isActive);
    
    const startDateObj = new Date(newLicense.startDate);
    const endDateObj = new Date(newLicense.endDate);
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24));
    
    const processedLicense = {
      ...newLicense,
      // Datos de la licencia asignada
      id: newLicense.id,
      companyId: newLicense.companyId,
      licenseKey: newLicense.licenseKey,
      isActive,
      startDate: newLicense.startDate,
      endDate: newLicense.endDate,
      
      // Datos de la plantilla
      features: licenseTemplate.features ? JSON.parse(licenseTemplate.features) : [],
      maxUsers: licenseTemplate.maxUsers || 10,
      maxClients: licenseTemplate.maxClients || 100,
      maxStorage: storageGB,
      name: newLicense.licenseName || licenseTemplate.name || `Licencia ${newLicense.licenseKey}`,
      type: newLicense.licenseType || licenseTemplate.type,
      description: licenseTemplate.description || `Plan ${licenseTemplate.type}`,
      price: newLicense.licensePrice || licenseTemplate.price,
      currency: newLicense.licenseCurrency || licenseTemplate.currency || 'USD',
      billingCycle: newLicense.licenseBillingCycle || licenseTemplate.billingCycle || 'monthly',
      
      // Datos de la empresa
      companyName: newLicense.companyName,
      companyEmail: newLicense.companyEmail,
      
      // Metadatos
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
    const { companyId, licenseId, startDate, endDate, isActive } = req.body;
    
    console.log('✏️ Actualizando licencia asignada:', id);
    console.log('📋 Datos recibidos:', { companyId, licenseId, startDate, endDate, isActive });
    
    // Verificar que la licencia existe
    const existingLicense = await queryOne('SELECT * FROM company_licenses WHERE id = ?', [id]);
    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        message: 'Licencia no encontrada'
      });
    }
    
    // Construir la consulta de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    
    if (companyId !== undefined) {
      // Verificar que la empresa existe
      const companyExists = await queryOne('SELECT id FROM companies WHERE id = ?', [companyId]);
      if (!companyExists) {
        return res.status(400).json({
          success: false,
          message: 'La empresa especificada no existe'
        });
      }
      updateFields.push('companyId = ?');
      updateValues.push(companyId);
    }
    
    if (licenseId !== undefined) {
      // Verificar que la plantilla de licencia existe
      const licenseExists = await queryOne('SELECT id FROM licenses WHERE id = ?', [licenseId]);
      if (!licenseExists) {
        return res.status(400).json({
          success: false,
          message: 'La plantilla de licencia especificada no existe'
        });
      }
      updateFields.push('licenseId = ?');
      updateValues.push(licenseId);
    }
    
    if (startDate !== undefined) {
      updateFields.push('startDate = ?');
      updateValues.push(startDate);
    }
    
    if (endDate !== undefined) {
      updateFields.push('endDate = ?');
      updateValues.push(endDate);
    }
    
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      updateValues.push(isActive ? 1 : 0);
    }
    
    // Validar fechas si ambas están presentes
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (endDateObj <= startDateObj) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        });
      }
    }
    
    // Si no hay campos para actualizar
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }
    
    // Agregar updatedAt
    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);
    
    // Ejecutar la actualización
    const updateQuery = `UPDATE company_licenses SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(updateQuery, updateValues);
    
    console.log('✅ Licencia actualizada correctamente');
    console.log('📝 Campos actualizados:', updateFields.map(field => field.split(' = ')[0]));
    
    
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
    
    const licenseStartDate = new Date(license.startDate);
    const licenseEndDate = new Date(license.endDate);
    const daysDiff = Math.ceil((licenseEndDate.getTime() - licenseStartDate.getTime()) / (1000 * 3600 * 24));
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

// ==================== FUNCIONES PARA PLANTILLAS DE LICENCIAS ====================

// Obtener todas las plantillas de licencias
export const getLicenseTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔄 Obteniendo plantillas de licencias...');
    
    const { search, type, status } = req.query;
    console.log('📋 Query params:', { search, type, status });
    
    // Primero verificar si hay datos en la tabla
    const countResult = await queryOne('SELECT COUNT(*) as count FROM licenses');
    console.log('📊 Total plantillas en BD:', countResult.count);
    
    let whereConditions = ['1=1'];
    let params: any[] = [];
    
    // Filtro por búsqueda
    if (search) {
      whereConditions.push('(l.name LIKE ? OR l.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Filtro por tipo
    if (type) {
      whereConditions.push('l.type = ?');
      params.push(type);
    }
    
    // Filtro por estado
    if (status === 'active') {
      whereConditions.push('l.isActive = 1');
    } else if (status === 'inactive') {
      whereConditions.push('l.isActive = 0');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const templatesQuery = `
      SELECT 
        l.*,
        COUNT(cl.id) as companiesCount,
        COUNT(CASE WHEN cl.isActive = 1 THEN 1 END) as activeCompaniesCount
      FROM licenses l
      LEFT JOIN company_licenses cl ON l.id = cl.licenseId
      WHERE ${whereClause}
      GROUP BY l.id
      ORDER BY l.createdAt DESC
    `;
    
    console.log('📋 Ejecutando consulta de plantillas:', templatesQuery);
    console.log('📋 Parámetros:', params);
    
    const templates = await query(templatesQuery, params);
    
    // Procesar plantillas
    const processedTemplates = templates.map((template: any) => {
      const storageGB = Math.round((template.maxStorage || 0) / (1024 * 1024 * 1024));
      
      return {
        ...template,
        features: template.features ? JSON.parse(template.features) : [],
        maxStorage: storageGB,
        isActive: Boolean(template.isActive),
        companiesCount: Number(template.companiesCount) || 0,
        activeCompaniesCount: Number(template.activeCompaniesCount) || 0
      };
    });
    
    console.log('✅ Plantillas obtenidas:', processedTemplates.length);
    
    res.json({
      success: true,
      data: processedTemplates,
      message: `${processedTemplates.length} plantilla(s) encontrada(s)`
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo plantillas:', error);
    return next(error);
  }
};

// Obtener plantilla de licencia por ID
export const getLicenseTemplateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Obteniendo plantilla de licencia por ID:', id);
    
    // Validar que el ID no esté vacío
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de plantilla requerido'
      });
    }
    
    // Obtener la plantilla
    const template = await queryOne('SELECT * FROM licenses WHERE id = ?', [id]);
    
    if (!template) {
      console.log('❌ Plantilla no encontrada:', id);
      return res.status(404).json({
        success: false,
        message: 'Plantilla de licencia no encontrada'
      });
    }
    
    console.log('✅ Plantilla encontrada:', template.name);
    
    // Procesar datos para el frontend
    const processedTemplate = {
      ...template,
      features: template.features ? JSON.parse(template.features) : [],
      isActive: Boolean(template.isActive),
      companiesCount: 0, // Se puede calcular si es necesario
      activeCompaniesCount: 0 // Se puede calcular si es necesario
    };
    
    res.json({
      success: true,
      data: processedTemplate
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo plantilla por ID:', error);
    return next(error);
  }
};

// Crear nueva plantilla de licencia
export const createLicenseTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      type,
      description,
      maxUsers,
      maxClients,
      features,
      price,
      currency = 'USD',
      billingCycle = 'monthly',
      isActive = true
    } = req.body;
    
    console.log('➕ Creando plantilla de licencia:', { name, type });
    console.log('📥 Datos recibidos del frontend:', req.body);
    
    // Validaciones
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }
    
    if (!type || !['basic', 'premium', 'enterprise'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de licencia inválido'
      });
    }
    
    // Verificar que no exista una plantilla con el mismo tipo
    const existingTemplate = await queryOne('SELECT id FROM licenses WHERE type = ?', [type]);
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una plantilla para el tipo ${type}`
      });
    }
    
    const templateId = generateId();
    
    // Insertar plantilla (sin maxStorage)
    await query(`
      INSERT INTO licenses (
        id, name, type, description, maxUsers, maxClients, 
        features, price, currency, billingCycle, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      templateId,
      name.trim(),
      type,
      description || '',
      maxUsers || 10,
      maxClients || 100,
      JSON.stringify(features || []),
      price || 0,
      currency,
      billingCycle,
      isActive ? 1 : 0
    ]);
    
    console.log('✅ Plantilla creada con ID:', templateId);
    
    // Obtener la plantilla creada
    const newTemplate = await queryOne('SELECT * FROM licenses WHERE id = ?', [templateId]);
    
    const processedTemplate = {
      ...newTemplate,
      features: newTemplate.features ? JSON.parse(newTemplate.features) : [],
      isActive: Boolean(newTemplate.isActive),
      companiesCount: 0,
      activeCompaniesCount: 0
    };
    
    res.status(201).json({
      success: true,
      data: processedTemplate,
      message: 'Plantilla de licencia creada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando plantilla:', error);
    return next(error);
  }
};

// Actualizar plantilla de licencia
export const updateLicenseTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      maxUsers,
      maxClients,
      features,
      price,
      currency,
      billingCycle,
      isActive
    } = req.body;
    
    console.log('🔄 Actualizando plantilla:', id);
    console.log('📥 Datos recibidos del frontend:', req.body);
    
    // Verificar que la plantilla existe
    const existingTemplate = await queryOne('SELECT * FROM licenses WHERE id = ?', [id]);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }
    
    // Actualizar plantilla (sin maxStorage)
    await query(`
      UPDATE licenses SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        maxUsers = COALESCE(?, maxUsers),
        maxClients = COALESCE(?, maxClients),
        features = COALESCE(?, features),
        price = COALESCE(?, price),
        currency = COALESCE(?, currency),
        billingCycle = COALESCE(?, billingCycle),
        isActive = COALESCE(?, isActive),
        updatedAt = NOW()
      WHERE id = ?
    `, [
      name?.trim(),
      description,
      maxUsers,
      maxClients,
      features ? JSON.stringify(features) : null,
      price,
      currency,
      billingCycle,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      id
    ]);
    
    console.log('✅ Plantilla actualizada');
    
    // Obtener la plantilla actualizada
    const updatedTemplate = await queryOne('SELECT * FROM licenses WHERE id = ?', [id]);
    
    const processedTemplate = {
      ...updatedTemplate,
      features: updatedTemplate.features ? JSON.parse(updatedTemplate.features) : [],
      isActive: Boolean(updatedTemplate.isActive)
    };
    
    res.json({
      success: true,
      data: processedTemplate,
      message: 'Plantilla actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando plantilla:', error);
    return next(error);
  }
};

// Eliminar plantilla de licencia
export const deleteLicenseTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Eliminando plantilla:', id);
    
    // Verificar que la plantilla existe
    const existingTemplate = await queryOne('SELECT * FROM licenses WHERE id = ?', [id]);
    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }
    
    // Verificar si hay licencias de empresas usando esta plantilla
    const companiesUsingTemplate = await queryOne('SELECT COUNT(*) as count FROM company_licenses WHERE licenseId = ?', [id]);
    if (companiesUsingTemplate.count > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la plantilla porque ${companiesUsingTemplate.count} empresa(s) la están usando`
      });
    }
    
    // Eliminar plantilla
    await query('DELETE FROM licenses WHERE id = ?', [id]);
    
    console.log('✅ Plantilla eliminada');
    
    res.json({
      success: true,
      message: 'Plantilla eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando plantilla:', error);
    return next(error);
  }
};

// FUNCIÓN TEMPORAL: Insertar licencias predefinidas
export const insertDefaultLicenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔄 Insertando licencias predefinidas...');
    
    // Verificar si ya existen licencias
    const existingLicenses = await query('SELECT COUNT(*) as count FROM licenses');
    if (existingLicenses[0].count > 0) {
      return res.json({
        success: true,
        message: 'Las licencias ya existen',
        data: await query('SELECT id, name, type FROM licenses ORDER BY type')
      });
    }
    
    // Generar IDs únicos
    const basicId = generateId();
    const premiumId = generateId();
    const enterpriseId = generateId();
    
    console.log('📋 Creando licencias con IDs:');
    console.log('   - Básica:', basicId);
    console.log('   - Premium:', premiumId);
    console.log('   - Empresarial:', enterpriseId);
    
    // Insertar Plan Básico
    await query(`
      INSERT INTO licenses (
        id, name, type, description, maxUsers, maxClients, maxStorage, 
        features, price, currency, billingCycle, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      basicId,
      'Plan Básico',
      'basic',
      'Plan básico para clínicas pequeñas con funcionalidades esenciales',
      10,
      100,
      5368709120, // 5GB en bytes
      JSON.stringify([
        "Gestión de usuarios",
        "Gestión de clientes", 
        "Gestión de citas",
        "Gestión de tratamientos",
        "Inventario básico",
        "Reportes básicos"
      ]),
      29.99,
      'USD',
      'monthly',
      1
    ]);
    
    // Insertar Plan Premium
    await query(`
      INSERT INTO licenses (
        id, name, type, description, maxUsers, maxClients, maxStorage, 
        features, price, currency, billingCycle, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      premiumId,
      'Plan Premium',
      'premium',
      'Plan avanzado para clínicas medianas con funcionalidades adicionales',
      50,
      500,
      26843545600, // 25GB en bytes
      JSON.stringify([
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
      ]),
      79.99,
      'USD',
      'monthly',
      1
    ]);
    
    // Insertar Plan Empresarial
    await query(`
      INSERT INTO licenses (
        id, name, type, description, maxUsers, maxClients, maxStorage, 
        features, price, currency, billingCycle, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      enterpriseId,
      'Plan Empresarial',
      'enterprise',
      'Plan completo para grandes organizaciones con todas las funcionalidades',
      -1, // Ilimitado
      -1, // Ilimitado
      107374182400, // 100GB en bytes
      JSON.stringify([
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
      ]),
      199.99,
      'USD',
      'monthly',
      1
    ]);
    
    console.log('✅ Licencias predefinidas insertadas correctamente');
    
    // Verificar inserción
    const insertedLicenses = await query('SELECT id, name, type, price FROM licenses ORDER BY type');
    
    res.json({
      success: true,
      message: 'Licencias predefinidas creadas exitosamente',
      data: insertedLicenses
    });
    
  } catch (error) {
    console.error('❌ Error insertando licencias:', error);
    return next(error);
  }
};

/**
 * Obtener estado de la licencia de la empresa actual
 */
export const getCurrentLicenseStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Obteniendo estado de licencia para empresa...');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener la empresa actual del usuario
    const companyId = req.user.currentCompanyId || req.user.companies?.current?.id;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no tiene empresa asignada',
        data: {
          hasCompany: false,
          isValid: false,
          reason: 'NO_COMPANY'
        }
      });
    }

    console.log(`🏢 Verificando licencia para empresa: ${companyId}`);

    // Verificar licencia de la empresa
    const licenseCheck = await checkCompanyLicense(companyId);

    // Obtener información adicional de la empresa
    const companyInfo = await queryOne(`
      SELECT name, email, phone
      FROM companies 
      WHERE id = ?
    `, [companyId]);

    const responseData = {
      hasCompany: true,
      companyId,
      companyInfo,
      isValid: licenseCheck.isValid,
      reason: licenseCheck.reason,
      licenseInfo: licenseCheck.licenseInfo
    };

    console.log('📊 Estado de licencia:', {
      companyId,
      isValid: licenseCheck.isValid,
      reason: licenseCheck.reason,
      hasLicenseInfo: !!licenseCheck.licenseInfo
    });

    return res.json({
      success: true,
      message: licenseCheck.isValid ? 'Licencia válida' : 'Problema con la licencia',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de licencia:', error);
    return next(error);
  }
};
