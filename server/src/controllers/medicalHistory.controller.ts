import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/medical-history');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `medical-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Solo permitir imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Solo se permiten archivos de imagen', 400), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 5 // Máximo 5 archivos
  }
});

// Crear historial médico automáticamente cuando una cita se completa
export const createMedicalHistoryFromAppointment = async (appointmentId: string, createdBy: string) => {
  try {
    console.log('🏥 Creando historial médico para cita:', appointmentId);

    // Obtener información completa de la cita
    const appointmentData = await queryOne<any>(`
      SELECT 
        a.*,
        c.id as clientId,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName,
        GROUP_CONCAT(t.name SEPARATOR ', ') as treatmentNames
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN users ue ON a.employeeId = ue.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      WHERE a.id = ?
      GROUP BY a.id
    `, [appointmentId]);

    if (!appointmentData) {
      throw new AppError('Cita no encontrada', 404);
    }

    // Verificar si ya existe un historial para esta cita
    const existingHistory = await queryOne(`
      SELECT id FROM medical_history 
      WHERE appointmentId = ?
    `, [appointmentId]);

    if (existingHistory) {
      console.log('⚠️ Ya existe historial médico para esta cita:', existingHistory.id);
      return existingHistory.id;
    }

    // Crear el historial médico
    const historyId = generateId();

    await query(`
      INSERT INTO medical_history (
        id, clientId, appointmentId, date, diagnosis, 
        attachments, createdBy, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      historyId,
      appointmentData.clientId,
      appointmentId,
      appointmentData.date,
      appointmentData.diagnosis || '', // Diagnóstico inicial vacío
      null, // attachments se agregarán después
      createdBy
    ]);

    console.log('✅ Historial médico creado:', historyId);
    return historyId;

  } catch (error) {
    console.error('❌ Error al crear historial médico:', error);
    throw error;
  }
};

// Obtener historial médico de un cliente
export const getMedicalHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clientId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    console.log('📋 [BACKEND] Obteniendo historial médico para cliente:', clientId);
    console.log('👤 [BACKEND] Usuario que hace la petición:', req.user?.id, req.user?.email);
    console.log('📊 [BACKEND] Parámetros de paginación:', { page, limit, offset });

    // Verificar permisos
    if (!req.user?.isMaster) {
      // Solo admin, empleados de la empresa o el propio cliente pueden ver el historial
      const isAuthorized = await queryOne(`
        SELECT 1 FROM clients c
        INNER JOIN users u ON c.userId = u.id
        WHERE c.id = ? AND (
          c.userId = ? OR 
          EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.userId = ? AND uc.companyId = c.companyId 
            AND uc.role IN ('admin', 'employee') AND uc.isActive = 1
          )
        )
      `, [clientId, req.user?.id, req.user?.id]);

      if (!isAuthorized) {
        throw new AppError('No tienes permisos para ver este historial', 403);
      }
    }

    // Obtener total de registros
    console.log('🔍 [BACKEND] Ejecutando consulta de conteo para clientId:', clientId);
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM medical_history WHERE clientId = ?
    `, [clientId]);

    const total = totalResult?.total || 0;
    console.log(' [BACKEND] Total de registros encontrados:', total);
    console.log(' [BACKEND] Resultado completo de conteo:', totalResult);

    // Obtener registros del historial con datos de la cita (sin LIMIT/OFFSET para Railway MySQL)
    const allHistory = await query<any>(`
      SELECT 
        mh.*,
        uc.firstName as createdByFirstName,
        uc.lastName as createdByLastName,
        DATE_FORMAT(a.date, '%Y-%m-%d') as appointmentDate,
        TIME_FORMAT(a.startTime, '%H:%i:%s') as appointmentStartTime,
        TIME_FORMAT(a.endTime, '%H:%i:%s') as appointmentEndTime,
        a.status as appointmentStatus,
        a.notes as appointmentNotes,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName,
        GROUP_CONCAT(t.name SEPARATOR ', ') as treatmentNames,
        GROUP_CONCAT(at.price SEPARATOR ', ') as treatmentPrices
      FROM medical_history mh
      LEFT JOIN users uc ON mh.createdBy = uc.id
      LEFT JOIN appointments a ON mh.appointmentId = a.id
      LEFT JOIN users ue ON a.employeeId = ue.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      WHERE mh.clientId = ?
      GROUP BY mh.id, mh.appointmentId, a.date, a.startTime, a.endTime, a.status, a.notes, 
               uc.firstName, uc.lastName, ue.firstName, ue.lastName
      ORDER BY mh.date DESC, mh.createdAt DESC
    `, [clientId]);

    // Aplicar paginación manual
    const history = allHistory.slice(offset, offset + limit);

    console.log(' [BACKEND] Registros obtenidos de la base de datos:', history);
    console.log(' [BACKEND] Número de registros obtenidos:', history.length);
    console.log('📋 [BACKEND] Registros obtenidos de la base de datos:', history);
    console.log('📊 [BACKEND] Número de registros obtenidos:', history.length);

    // Procesar attachments (convertir JSON string a array)
    const processedHistory = history.map((record: any) => ({
      ...record,
      attachments: record.attachments ? JSON.parse(record.attachments) : []
    }));

    console.log('✅ [BACKEND] Enviando respuesta con', processedHistory.length, 'registros');

    res.json({
      success: true,
      data: processedHistory,
      message: 'Historial médico obtenido exitosamente',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un registro específico del historial médico
export const getMedicalHistoryRecord = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const record = await queryOne<any>(`
      SELECT 
        mh.*,
        uc.firstName as createdByFirstName,
        uc.lastName as createdByLastName,
        cl.userId as clientUserId
      FROM medical_history mh
      LEFT JOIN users uc ON mh.createdBy = uc.id
      LEFT JOIN clients cl ON mh.clientId = cl.id
      WHERE mh.id = ?
    `, [id]);

    if (!record) {
      throw new AppError('Registro de historial médico no encontrado', 404);
    }

    // Verificar permisos
    if (!req.user?.isMaster) {
      const isAuthorized = await queryOne(`
        SELECT 1 FROM clients c
        WHERE c.id = ? AND (
          c.userId = ? OR 
          EXISTS (
            SELECT 1 FROM user_companies uc 
            WHERE uc.userId = ? AND uc.companyId = c.companyId 
            AND uc.role IN ('admin', 'employee') AND uc.isActive = 1
          )
        )
      `, [record.clientId, req.user?.id, req.user?.id]);

      if (!isAuthorized) {
        throw new AppError('No tienes permisos para ver este registro', 403);
      }
    }

    // Procesar attachments
    const processedRecord = {
      ...record,
      attachments: record.attachments ? JSON.parse(record.attachments) : []
    };

    res.json({
      success: true,
      data: processedRecord,
      message: 'Registro obtenido exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar historial médico
export const updateMedicalHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { diagnosis } = req.body; // Solo permitir editar diagnosis

    console.log('📝 Actualizando historial médico:', id);
    console.log('📝 Solo se puede editar: diagnosis y attachments');

    // Verificar que el registro existe
    const existingRecord = await queryOne<any>(`
      SELECT mh.*, cl.userId as clientUserId 
      FROM medical_history mh
      LEFT JOIN clients cl ON mh.clientId = cl.id
      WHERE mh.id = ?
    `, [id]);

    if (!existingRecord) {
      throw new AppError('Registro de historial médico no encontrado', 404);
    }

    // Verificar permisos (solo admin, empleados de la empresa o master)
    if (!req.user?.isMaster) {
      const isAuthorized = await queryOne(`
        SELECT 1 FROM clients c
        WHERE c.id = ? AND EXISTS (
          SELECT 1 FROM user_companies uc 
          WHERE uc.userId = ? AND uc.companyId = c.companyId 
          AND uc.role IN ('admin', 'employee') AND uc.isActive = 1
        )
      `, [existingRecord.clientId, req.user?.id]);

      if (!isAuthorized) {
        throw new AppError('No tienes permisos para editar este registro', 403);
      }
    }

    // Manejar archivos subidos
    let attachments = existingRecord.attachments ? JSON.parse(existingRecord.attachments) : [];
    
    if (req.files && Array.isArray(req.files)) {
      const newFiles = req.files.map((file: any) => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        uploadDate: new Date().toISOString()
      }));

      // Limitar a máximo 5 archivos
      attachments = [...attachments, ...newFiles].slice(0, 5);
    }

    // Actualizar el registro (solo diagnosis y attachments)
    await query(`
      UPDATE medical_history 
      SET diagnosis = ?, attachments = ?
      WHERE id = ?
    `, [
      diagnosis || existingRecord.diagnosis,
      JSON.stringify(attachments),
      id
    ]);

    // Obtener el registro actualizado
    const updatedRecord = await queryOne<any>(`
      SELECT 
        mh.*,
        uc.firstName as createdByFirstName,
        uc.lastName as createdByLastName
      FROM medical_history mh
      LEFT JOIN users uc ON mh.createdBy = uc.id
      WHERE mh.id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...updatedRecord,
        attachments: JSON.parse(updatedRecord.attachments || '[]')
      },
      message: 'Historial médico actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar archivo del historial médico
export const deleteAttachment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, filename } = req.params;

    console.log('🗑️ Eliminando archivo del historial:', { id, filename });

    // Verificar que el registro existe
    const record = await queryOne<any>(`
      SELECT mh.*, cl.userId as clientUserId 
      FROM medical_history mh
      LEFT JOIN clients cl ON mh.clientId = cl.id
      WHERE mh.id = ?
    `, [id]);

    if (!record) {
      throw new AppError('Registro de historial médico no encontrado', 404);
    }

    // Verificar permisos
    if (!req.user?.isMaster) {
      const isAuthorized = await queryOne(`
        SELECT 1 FROM clients c
        WHERE c.id = ? AND EXISTS (
          SELECT 1 FROM user_companies uc 
          WHERE uc.userId = ? AND uc.companyId = c.companyId 
          AND uc.role IN ('admin', 'employee') AND uc.isActive = 1
        )
      `, [record.clientId, req.user?.id]);

      if (!isAuthorized) {
        throw new AppError('No tienes permisos para eliminar archivos de este registro', 403);
      }
    }

    // Obtener attachments actuales
    let attachments = record.attachments ? JSON.parse(record.attachments) : [];
    
    // Filtrar el archivo a eliminar
    attachments = attachments.filter((file: any) => file.filename !== filename);

    // Actualizar el registro
    await query(`
      UPDATE medical_history 
      SET attachments = ?
      WHERE id = ?
    `, [JSON.stringify(attachments), id]);

    // Eliminar el archivo físico
    const filePath = path.join(__dirname, '../../uploads/medical-history', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};