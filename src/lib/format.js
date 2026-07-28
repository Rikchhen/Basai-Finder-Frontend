export function formatPrice(amount) {
  if (amount === undefined || amount === null) return '';
  return `NPR ${Number(amount).toLocaleString('en-IN')}`;
}

export function formatRentRange(min, max) {
  return `NPR ${Number(min).toLocaleString('en-IN')} - ${Number(max).toLocaleString('en-IN')}`;
}
