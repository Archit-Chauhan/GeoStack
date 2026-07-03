// Normalizes Mongoose entities that may carry `id` (virtual) and/or `_id`.
export function eid(entity: { id?: string; _id?: string } | string | null | undefined): string {
  if (!entity) return '';
  if (typeof entity === 'string') return entity;
  return entity.id ?? entity._id ?? '';
}

/** Safely read a possibly-populated ref's display name. */
export function refName(
  ref: { name?: string; id?: string; _id?: string } | string | null | undefined,
  fallback = '—'
): string {
  if (!ref) return fallback;
  if (typeof ref === 'string') return fallback;
  return ref.name ?? fallback;
}
