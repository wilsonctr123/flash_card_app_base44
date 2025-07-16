import { z } from "zod";
import { ValidationError } from "../middleware/errorHandler";

export class ValidationService {
  static validateId(id: string | number, fieldName = "id"): number {
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numId) || numId <= 0) {
      throw new ValidationError(`Invalid ${fieldName}: must be a positive integer`);
    }
    
    return numId;
  }
  
  static validateUserId(userId: string): string {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new ValidationError("Invalid user ID");
    }
    
    return userId.trim();
  }
  
  static validatePagination(page?: string, limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError("Page must be a positive integer");
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError("Limit must be between 1 and 100");
    }
    
    return { page: pageNum, limit: limitNum };
  }
  
  static validateEnum<T extends string>(
    value: string, 
    allowedValues: readonly T[], 
    fieldName: string
  ): T {
    if (!allowedValues.includes(value as T)) {
      throw new ValidationError(
        `Invalid ${fieldName}: must be one of ${allowedValues.join(', ')}`
      );
    }
    
    return value as T;
  }
  
  static validateDateRange(startDate?: string, endDate?: string) {
    let start: Date | undefined;
    let end: Date | undefined;
    
    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new ValidationError("Invalid start date format");
      }
    }
    
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new ValidationError("Invalid end date format");
      }
    }
    
    if (start && end && start > end) {
      throw new ValidationError("Start date must be before end date");
    }
    
    return { startDate: start, endDate: end };
  }
  
  static sanitizeString(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError("Input must be a string");
    }
    
    const sanitized = input.trim();
    
    if (sanitized.length > maxLength) {
      throw new ValidationError(`Input too long: maximum ${maxLength} characters`);
    }
    
    return sanitized;
  }
  
  static validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Validation failed", error.errors);
      }
      throw error;
    }
  }
}