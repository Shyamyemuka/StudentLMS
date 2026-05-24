/**
 * Sanitizes a filename for safe storage
 * - Removes/replaces special characters
 * - Converts spaces to hyphens
 * - Limits length to 100 characters
 * - Preserves file extension
 */
export function sanitizeFilename(filename: string): string {
  // Extract extension
  const lastDot = filename.lastIndexOf(".");
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot) : "";

  // Sanitize the name part
  let sanitized = name
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters (keep only alphanumeric, hyphens, and basic punctuation)
    .replace(/[^a-zA-Z0-9\-()]/g, "")
    // Remove multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  // Limit length (leave room for extension and timestamp if needed)
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // If sanitization resulted in empty string, use fallback
  if (!sanitized) {
    sanitized = "file";
  }

  return sanitized + ext;
}

/**
 * Creates a unique filename by adding timestamp if needed
 * Useful when the same filename might be uploaded multiple times
 */
export function createUniqueFilename(
  filename: string,
  addTimestamp = false
): string {
  const sanitized = sanitizeFilename(filename);

  if (!addTimestamp) {
    return sanitized;
  }

  // Add timestamp before extension
  const lastDot = sanitized.lastIndexOf(".");
  if (lastDot > 0) {
    const name = sanitized.substring(0, lastDot);
    const ext = sanitized.substring(lastDot);
    return `${name}-${Date.now()}${ext}`;
  }

  return `${sanitized}-${Date.now()}`;
}
