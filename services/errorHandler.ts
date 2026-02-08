/**
 * Centralized Error Handling for Supabase
 * Provides consistent error messages across the application
 */

export class SupabaseError extends Error {
  code: string;
  details?: string;

  constructor(message: string, code: string, details?: string) {
    super(message);
    this.name = 'SupabaseError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Maps Supabase error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Unique constraint violations
  '23505': 'Вы уже голосовали в этом опросе',
  
  // Foreign key violations
  '23503': 'Связанные данные не найдены',
  
  // Not null violations
  '23502': 'Не все обязательные поля заполнены',
  
  // Check constraint violations
  '23514': 'Нарушено ограничение валидации',
  
  // Insufficient privileges
  '42501': 'Нет прав доступа к этой операции',
  
  // Permission denied
  'PGRST116': 'Таблица или запись не найдена',
  
  // JWT errors
  'JWT': 'Сессия истекла. Пожалуйста, войдите снова',
  
  // Default
  'default': 'Произошла ошибка. Попробуйте позже',
};

/**
 * Handles Supabase errors and returns user-friendly messages
 */
export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);

  // If error is already our custom error
  if (error instanceof SupabaseError) {
    return error.message;
  }

  // Extract error code from various formats
  const errorCode = error.code || error.message?.match(/^([A-Z0-9]+):/)?.[1] || 'default';

  // Return custom message or fall back to error message
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['default'];
};

/**
 * Checks if an error is a specific type
 */
export const isSupabaseErrorCode = (error: any, code: string): boolean => {
  return error.code === code || error.message?.includes(code);
};

/**
 * Extracts error details from Supabase error
 */
export const getErrorDetails = (error: any): string => {
  return error.details || error.hint || error.message || 'Неизвестная ошибка';
};

/**
 * Wraps async functions with error handling
 */
export const withErrorHandler = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const message = handleSupabaseError(error);
    throw new SupabaseError(message, (error as any).code || 'UNKNOWN');
  }
};
