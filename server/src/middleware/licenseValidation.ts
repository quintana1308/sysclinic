import { Response, NextFunction } from 'express';
import { queryOne } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

/**
 * Verifica si la licencia de una empresa está activa y no ha vencido
 */
export const checkCompanyLicense = async (companyId: string): Promise<{
  isValid: boolean;
  licenseInfo?: any;
  reason?: string;
}> => {
  try {
    console.log(`🔍 Verificando licencia para empresa: ${companyId}`);

    // Buscar licencia activa de la empresa
    const license = await queryOne<any>(`
      SELECT 
        cl.id,
        cl.licenseKey,
        cl.startDate,
        cl.endDate,
        cl.isActive,
        c.name as companyName,
        l.name as licenseName,
        l.type as licenseType
      FROM company_licenses cl
      JOIN companies c ON cl.companyId = c.id
      JOIN licenses l ON cl.licenseId = l.id
      WHERE cl.companyId = ? AND cl.isActive = 1
      ORDER BY cl.endDate DESC
      LIMIT 1
    `, [companyId]);

    if (!license) {
      console.log(`❌ No se encontró licencia activa para empresa: ${companyId}`);
      return {
        isValid: false,
        reason: 'NO_LICENSE'
      };
    }

    const now = new Date();
    const endDate = new Date(license.endDate);
    const startDate = new Date(license.startDate);

    // Verificar si la licencia está en el período válido
    if (now < startDate) {
      console.log(`❌ Licencia aún no ha iniciado para empresa: ${companyId}`, {
        startDate: license.startDate,
        currentDate: now.toISOString()
      });
      return {
        isValid: false,
        licenseInfo: license,
        reason: 'NOT_STARTED'
      };
    }

    if (now > endDate) {
      console.log(`❌ Licencia vencida para empresa: ${companyId}`, {
        endDate: license.endDate,
        currentDate: now.toISOString(),
        daysExpired: Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      });
      return {
        isValid: false,
        licenseInfo: license,
        reason: 'EXPIRED'
      };
    }

    // Licencia válida
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`✅ Licencia válida para empresa: ${companyId}`, {
      licenseName: license.licenseName,
      licenseType: license.licenseType,
      endDate: license.endDate,
      daysRemaining
    });

    return {
      isValid: true,
      licenseInfo: {
        ...license,
        daysRemaining
      }
    };

  } catch (error) {
    console.error('❌ Error verificando licencia de empresa:', error);
    return {
      isValid: false,
      reason: 'ERROR'
    };
  }
};

/**
 * Middleware para validar licencia de empresa en requests autenticados
 * Permite acceso solo a usuarios master si la licencia está vencida
 */
export const validateLicense = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401);
    }

    // Los usuarios master siempre pueden acceder
    if (req.user.isMaster) {
      console.log(`🔑 Usuario master detectado: ${req.user.email} - Acceso permitido sin validación de licencia`);
      return next();
    }

    // Obtener la empresa actual del usuario
    const companyId = req.user.currentCompanyId || req.user.companies?.current?.id;
    
    if (!companyId) {
      console.log(`❌ Usuario ${req.user.email} no tiene empresa asignada`);
      throw new AppError('Usuario no tiene empresa asignada', 403);
    }

    // Verificar licencia de la empresa
    const licenseCheck = await checkCompanyLicense(companyId);

    if (!licenseCheck.isValid) {
      let errorMessage = 'Acceso denegado';
      let errorCode = 'LICENSE_INVALID';

      switch (licenseCheck.reason) {
        case 'NO_LICENSE':
          errorMessage = 'Su empresa no tiene una licencia activa. Contacte al administrador.';
          errorCode = 'NO_LICENSE';
          break;
        case 'EXPIRED':
          errorMessage = `Su licencia ha vencido el ${new Date(licenseCheck.licenseInfo.endDate).toLocaleDateString('es-ES')}. Contacte al administrador para renovar.`;
          errorCode = 'LICENSE_EXPIRED';
          break;
        case 'NOT_STARTED':
          errorMessage = `Su licencia iniciará el ${new Date(licenseCheck.licenseInfo.startDate).toLocaleDateString('es-ES')}.`;
          errorCode = 'LICENSE_NOT_STARTED';
          break;
        default:
          errorMessage = 'Error verificando licencia. Contacte al administrador.';
          errorCode = 'LICENSE_ERROR';
      }

      console.log(`🚫 Acceso denegado para usuario ${req.user.email} de empresa ${companyId}:`, {
        reason: licenseCheck.reason,
        licenseInfo: licenseCheck.licenseInfo
      });

      // Crear error personalizado con información adicional
      const error = new AppError(errorMessage, 403);
      (error as any).code = errorCode;
      (error as any).licenseInfo = licenseCheck.licenseInfo;
      
      throw error;
    }

    // Licencia válida - continuar
    console.log(`✅ Licencia válida para usuario ${req.user.email} de empresa ${companyId}`);
    
    // Agregar información de licencia al request para uso posterior
    req.licenseInfo = licenseCheck.licenseInfo;
    
    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Middleware opcional para validar licencia sin bloquear acceso
 * Solo agrega información de licencia al request
 */
export const checkLicenseInfo = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next();
    }

    const companyId = req.user.currentCompanyId || req.user.companies?.current?.id;
    
    if (companyId) {
      const licenseCheck = await checkCompanyLicense(companyId);
      req.licenseInfo = licenseCheck.licenseInfo;
      req.licenseValid = licenseCheck.isValid;
    }

    next();
  } catch (error) {
    // En modo opcional, no bloqueamos por errores
    console.warn('⚠️ Error en verificación opcional de licencia:', error);
    next();
  }
};

/**
 * Función utilitaria para verificar licencia desde controladores
 */
export const isCompanyLicenseValid = async (companyId: string): Promise<boolean> => {
  const result = await checkCompanyLicense(companyId);
  return result.isValid;
};
