/**
 * Pushes a value onto the params array and returns its placeholder ($1, $2, …).
 * Lets dynamic WHERE clauses be built without manually tracking parameter indices.
 */
export function addParam(params: unknown[], value: unknown): string {
  params.push(value);
  return `$${params.length}`;
}
