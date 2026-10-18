const moneyFormat = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 1234.5 -> "1.234,50"
export function formatMoney(amount: number) {
  return moneyFormat.format(amount);
}
