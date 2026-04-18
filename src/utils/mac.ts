/**
 * Нормализует MAC-адрес к формату AA:BB:CC:DD:EE:FF
 */
export function normalizeMac(mac: string): string {
  // Убираем все разделители
  const clean = mac.replace(/[:-]/g, '').toLowerCase();

  // Проверяем валидность
  if (!/^[0-9a-f]{12}$/i.test(clean)) {
    throw new Error('Invalid MAC address format');
  }

  // Форматируем с двоеточиями
  return clean
    .match(/.{1,2}/g)!
    .join(':')
    .toUpperCase();
}

/**
 * Валидация MAC-адреса
 */
export function isValidMac(mac: string): boolean {
  try {
    normalizeMac(mac);
    return true;
  } catch {
    return false;
  }
}
