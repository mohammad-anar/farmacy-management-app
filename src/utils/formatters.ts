export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return `$${amount.toFixed(2)}`;
}

export function formatQuantity(quantity: number | null | undefined): string {
  if (quantity === null || quantity === undefined) return '0';
  // If whole number, format without decimals, else with up to 2 decimal places
  return Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}
