export function validateDate(date) {
  const time = Date.parse(date);
  if (!isNaN(time)) return new Date(date);
  return null;
}

export function createImagesJson({ h, v }: { h?: string; v?: string }) {
  return JSON.stringify({
    horizontal: h ?? null,
    vertical: v ?? null,
  });
}
