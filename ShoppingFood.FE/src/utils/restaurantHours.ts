/**
 * Restaurant open/closed helpers. Prefer backend `isOpenNow` when present.
 */
export function isRestaurantOpenNow(
  openingTime?: string | null,
  closingTime?: string | null,
  isOpenNow?: boolean | null
): boolean {
  if (typeof isOpenNow === 'boolean') return isOpenNow;
  if (!openingTime || !closingTime) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  const openTimeMins = (openH || 0) * 60 + (openM || 0);
  const closeTimeMins = (closeH || 0) * 60 + (closeM || 0);

  if (closeTimeMins < openTimeMins) {
    return currentTime >= openTimeMins || currentTime <= closeTimeMins;
  }

  return currentTime >= openTimeMins && currentTime <= closeTimeMins;
}
