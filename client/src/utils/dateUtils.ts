/**
 * Utilidades para manejo de fechas con zona horaria de Venezuela (America/Caracas)
 */

/**
 * Formatea una fecha de la base de datos para mostrar en la zona horaria de Venezuela
 * @param dateString - Fecha en formato string de la base de datos
 * @param format - Formato de salida ('short' | 'long' | 'input')
 * @returns Fecha formateada en zona horaria de Venezuela
 */
export const formatDateVenezuela = (dateString: string | null | undefined, format: 'short' | 'long' | 'input' = 'short'): string => {
  if (!dateString) return '';
  
  try {
    // Crear fecha asumiendo que viene de la base de datos como fecha local (no UTC)
    // Para fechas tipo "2021-01-01", las tratamos como fecha local de Venezuela
    const dateParts = dateString.split('T')[0].split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Los meses en JS son 0-indexados
    const day = parseInt(dateParts[2]);
    
    // Crear fecha en zona horaria local de Venezuela
    const date = new Date(year, month, day);
    
    switch (format) {
      case 'long':
        return date.toLocaleDateString('es-VE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'America/Caracas'
        });
      
      case 'input':
        // Para inputs de tipo date (formato YYYY-MM-DD)
        return `${year}-${month + 1 < 10 ? '0' : ''}${month + 1}-${day < 10 ? '0' : ''}${day}`;
      
      case 'short':
      default:
        return date.toLocaleDateString('es-VE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          timeZone: 'America/Caracas'
        });
    }
  } catch (error) {
    console.error('Error formateando fecha:', error, 'Fecha original:', dateString);
    return dateString || '';
  }
};

/**
 * Convierte una fecha de input (YYYY-MM-DD) a formato para enviar al backend
 * @param inputDate - Fecha del input en formato YYYY-MM-DD
 * @returns Fecha en formato para la base de datos
 */
export const formatDateForBackend = (inputDate: string): string => {
  if (!inputDate) return '';
  
  try {
    // El input ya viene en formato YYYY-MM-DD, solo validamos
    const dateParts = inputDate.split('-');
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      const day = parseInt(dateParts[2]);
      
      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return inputDate;
      }
    }
    
    throw new Error('Formato de fecha inválido');
  } catch (error) {
    console.error('Error procesando fecha para backend:', error, 'Fecha original:', inputDate);
    return inputDate;
  }
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para inputs de fecha
 * @returns Fecha actual en formato YYYY-MM-DD
 */
export const getCurrentDateForInput = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  return `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
};
