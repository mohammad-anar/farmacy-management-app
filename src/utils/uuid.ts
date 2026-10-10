/**
 * Lightweight UUID v4 generator for client-side operation IDs and entity IDs.
 */
export function generateUUID(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  const rawId = `${timestamp}-${randomPart}-${randomPart2}`;
  return prefix ? `${prefix}_${rawId}` : rawId;
}
