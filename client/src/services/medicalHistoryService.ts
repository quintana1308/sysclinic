import api from './api';

export interface MedicalHistoryRecord {
  id: string;
  clientId: string;
  appointmentId: string; // Ahora es requerido
  date: string;
  diagnosis: string;
  attachments: MedicalAttachment[];
  createdBy: string;
  createdByFirstName?: string;
  createdByLastName?: string;
  createdAt: string;
  // Datos de la cita relacionada
  appointmentDate?: string;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  appointmentStatus?: string;
  appointmentNotes?: string;
  employeeFirstName?: string;
  employeeLastName?: string;
  treatmentNames?: string;
  treatmentPrices?: string;
}

export interface MedicalAttachment {
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
}

export interface MedicalHistoryResponse {
  success: boolean;
  data: MedicalHistoryRecord[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MedicalHistoryRecordResponse {
  success: boolean;
  data: MedicalHistoryRecord;
  message: string;
}

export interface UpdateMedicalHistoryData {
  diagnosis?: string;
  attachments?: File[];
}

class MedicalHistoryService {
  // Obtener historial médico de un cliente
  async getMedicalHistory(clientId: string, page: number = 1, limit: number = 10): Promise<MedicalHistoryResponse> {
    try {
      console.log('🏥 Obteniendo historial médico:', { clientId, page, limit });
      
      const response = await api.get(`/medical-history/client/${clientId}`, {
        params: { page, limit }
      });
      
      console.log('✅ Historial médico obtenido:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al obtener historial médico:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener el historial médico');
    }
  }

  // Obtener un registro específico del historial médico
  async getMedicalHistoryRecord(recordId: string): Promise<MedicalHistoryRecordResponse> {
    try {
      console.log('🏥 Obteniendo registro de historial médico:', recordId);
      
      const response = await api.get(`/medical-history/${recordId}`);
      
      console.log('✅ Registro obtenido:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al obtener registro:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener el registro del historial médico');
    }
  }

  // Actualizar historial médico
  async updateMedicalHistory(recordId: string, data: UpdateMedicalHistoryData): Promise<MedicalHistoryRecordResponse> {
    try {
      console.log('📝 Actualizando historial médico:', { recordId, data });

      const formData = new FormData();

      // Agregar campos de texto (solo diagnosis es editable)
      if (data.diagnosis !== undefined) {
        formData.append('diagnosis', data.diagnosis);
      }

      // Agregar archivos
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file, index) => {
          formData.append('attachments', file);
        });
      }

      const response = await api.put(`/medical-history/${recordId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Historial médico actualizado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al actualizar historial médico:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar el historial médico');
    }
  }

  // Eliminar archivo del historial médico
  async deleteAttachment(recordId: string, filename: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🗑️ Eliminando archivo:', { recordId, filename });
      
      const response = await api.delete(`/medical-history/${recordId}/attachment/${filename}`);
      
      console.log('✅ Archivo eliminado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error al eliminar archivo:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar el archivo');
    }
  }

  // Obtener URL de imagen
  getImageUrl(filename: string): string {
    // Remover /api del baseURL para acceder a archivos estáticos
    const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}/uploads/medical-history/${filename}`;
  }

  // Validar archivos antes de subir
  validateFiles(files: File[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (files.length > maxFiles) {
      errors.push(`Máximo ${maxFiles} archivos permitidos`);
    }

    files.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Archivo ${index + 1}: Solo se permiten imágenes (JPEG, PNG, GIF, WebP)`);
      }

      if (file.size > maxSize) {
        errors.push(`Archivo ${index + 1}: El tamaño máximo es 5MB`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Formatear fecha para mostrar
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const medicalHistoryService = new MedicalHistoryService();
export default medicalHistoryService;
