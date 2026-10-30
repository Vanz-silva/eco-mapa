export function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Remove tags HTML e caracteres de controle de entradas de usuário.
export function sanitize(s) {
  if (s == null) return s;
  return String(s).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export const onlyDigits = (s) => String(s ?? '').replace(/\D/g, '');

export function escapeLike(s) {
  return s.replace(/[\\%_]/g, '\\$&');
}
