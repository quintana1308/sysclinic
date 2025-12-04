import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Error no manejado
  console.error('❌ Error no manejado:', err);
  
  // Manejar errores específicos de base de datos
  if (err.message && err.message.includes('Data too long for column')) {
    const columnMatch = err.message.match(/Data too long for column '(\w+)'/);
    const columnName = columnMatch ? columnMatch[1] : 'campo';
    
    return res.status(400).json({
      success: false,
      message: `El valor ingresado para ${columnName} es demasiado largo`,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Manejar errores de formato de fecha
  if (err.message && err.message.includes('Incorrect date value')) {
    return res.status(400).json({
      success: false,
      message: 'El formato de la fecha no es válido',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
