/**
 * Normalizes a project name by trimming whitespace
 */
export const normalizeProjectName = (name: string): string => name.trim();

/**
 * Converts a sort order string to SQL order
 */
export const toSqlOrder = (order?: "asc" | "desc"): "ASC" | "DESC" =>
  order === "asc" ? "ASC" : "DESC";

/**
 * Escapes special characters in search patterns for SQL LIKE queries
 * Uses a unique UUID as the escape character to avoid conflicts
 */
export const escapeSqlLikePattern = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) {
    return "";
  }
  // Replace special LIKE characters with escaped versions
  const escaped = trimmed.replace(/[%_]/g, "\\6b55d20a-9e0b-45c9-a208-1de7171e4f46");
  return `%${escaped}%`;
};

/**
 * Maps database row field names to camelCase property names
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Maps camelCase property names to snake_case database field names
 */
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Builds a dynamic UPDATE SQL statement from an object of updates
 */
export const buildUpdateFields = (
  updates: Record<string, unknown>,
  fieldMap?: Record<string, string>
): { fields: string[]; params: Record<string, unknown> } => {
  const fields: string[] = [];
  const params: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbField = fieldMap?.[key] ?? toSnakeCase(key);
      fields.push(`${dbField} = @${key}`);
      params[key] = value;
    }
  }

  return { fields, params };
};

/**
 * Validates that a value is a valid UUID format
 */
export const isValidUuid = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Creates a SQL placeholder string for IN queries
 */
export const createPlaceholders = (count: number): string => {
  return Array(count).fill("?").join(",");
};
