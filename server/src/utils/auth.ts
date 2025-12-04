import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { TokenPayload } from '../types';

// Hashear contraseña
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Comparar contraseña
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  console.log('🔍 comparePassword called with:');
  console.log('  - password:', password);
  console.log('  - hashedPassword:', hashedPassword);
  console.log('  - password type:', typeof password);
  console.log('  - hashedPassword type:', typeof hashedPassword);
  
  try {
    const result = await bcrypt.compare(password, hashedPassword);
    console.log('🔍 bcrypt.compare result:', result);
    return result;
  } catch (error) {
    console.log('🔍 bcrypt.compare error:', error);
    return false;
  }
};

// Generar token JWT
export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  // Usar jwt.sign directamente sin opciones separadas
  return jwt.sign(
    payload,
    secret,
    { expiresIn: '7d' }
  );
};

// Verificar token JWT
export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  return jwt.verify(token, secret) as TokenPayload;
};

// Generar código único de cliente
export const generateClientCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CLI-${timestamp}-${random}`;
};

// Generar ID único
export const generateId = (): string => {
  return uuidv4();
};

// Validar contraseña
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }

  return { valid: true };
};

// Sanitizar datos de usuario (remover password)
export const sanitizeUser = (user: any) => {
  const { password, ...sanitized } = user;
  return sanitized;
};
