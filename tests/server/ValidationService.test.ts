import { ValidationService } from "../../server/services/ValidationService";
import { ValidationError } from "../../server/middleware/errorHandler";
import { z } from "zod";

describe('ValidationService', () => {
  describe('validateId', () => {
    it('should validate positive integers', () => {
      expect(ValidationService.validateId(1)).toBe(1);
      expect(ValidationService.validateId("123")).toBe(123);
    });

    it('should throw ValidationError for invalid IDs', () => {
      expect(() => ValidationService.validateId(0)).toThrow(ValidationError);
      expect(() => ValidationService.validateId(-1)).toThrow(ValidationError);
      expect(() => ValidationService.validateId("abc")).toThrow(ValidationError);
      expect(() => ValidationService.validateId("")).toThrow(ValidationError);
    });
  });

  describe('validateUserId', () => {
    it('should validate non-empty string user IDs', () => {
      expect(ValidationService.validateUserId("user-123")).toBe("user-123");
      expect(ValidationService.validateUserId("  user-123  ")).toBe("user-123");
    });

    it('should throw ValidationError for invalid user IDs', () => {
      expect(() => ValidationService.validateUserId("")).toThrow(ValidationError);
      expect(() => ValidationService.validateUserId("   ")).toThrow(ValidationError);
      expect(() => ValidationService.validateUserId(null as any)).toThrow(ValidationError);
      expect(() => ValidationService.validateUserId(undefined as any)).toThrow(ValidationError);
    });
  });

  describe('validatePagination', () => {
    it('should return default values when no parameters provided', () => {
      const result = ValidationService.validatePagination();
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should validate valid pagination parameters', () => {
      const result = ValidationService.validatePagination("2", "50");
      expect(result).toEqual({ page: 2, limit: 50 });
    });

    it('should throw ValidationError for invalid pagination', () => {
      expect(() => ValidationService.validatePagination("0", "20")).toThrow(ValidationError);
      expect(() => ValidationService.validatePagination("1", "101")).toThrow(ValidationError);
      expect(() => ValidationService.validatePagination("abc", "20")).toThrow(ValidationError);
    });
  });

  describe('validateEnum', () => {
    const allowedValues = ['sm2', 'fsrs', 'anki'] as const;

    it('should validate allowed enum values', () => {
      expect(ValidationService.validateEnum('sm2', allowedValues, 'algorithm')).toBe('sm2');
      expect(ValidationService.validateEnum('fsrs', allowedValues, 'algorithm')).toBe('fsrs');
    });

    it('should throw ValidationError for invalid enum values', () => {
      expect(() => ValidationService.validateEnum('invalid', allowedValues, 'algorithm'))
        .toThrow(ValidationError);
    });
  });

  describe('validateDateRange', () => {
    it('should validate valid date ranges', () => {
      const result = ValidationService.validateDateRange('2023-01-01', '2023-12-31');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should handle undefined dates', () => {
      const result = ValidationService.validateDateRange();
      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should throw ValidationError for invalid dates', () => {
      expect(() => ValidationService.validateDateRange('invalid-date', '2023-12-31'))
        .toThrow(ValidationError);
      expect(() => ValidationService.validateDateRange('2023-12-31', '2023-01-01'))
        .toThrow(ValidationError);
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize valid strings', () => {
      expect(ValidationService.sanitizeString('  hello world  ')).toBe('hello world');
      expect(ValidationService.sanitizeString('test')).toBe('test');
    });

    it('should throw ValidationError for non-strings', () => {
      expect(() => ValidationService.sanitizeString(123 as any)).toThrow(ValidationError);
      expect(() => ValidationService.sanitizeString(null as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for strings that are too long', () => {
      const longString = 'a'.repeat(1001);
      expect(() => ValidationService.sanitizeString(longString)).toThrow(ValidationError);
    });
  });

  describe('validateSchema', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('should validate data against schema', () => {
      const validData = { name: 'John', age: 25 };
      const result = ValidationService.validateSchema(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw ValidationError for invalid data', () => {
      const invalidData = { name: '', age: -1 };
      expect(() => ValidationService.validateSchema(testSchema, invalidData))
        .toThrow(ValidationError);
    });
  });
});