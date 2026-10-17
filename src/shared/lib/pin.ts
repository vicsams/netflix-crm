// PINs are stored as numbers, which drops leading zeros: 123 -> "0123"
export function formatPin(pin: number | null | undefined) {
  return pin === null || pin === undefined ? "-" : String(pin).padStart(4, "0");
}
