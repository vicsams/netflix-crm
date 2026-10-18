// The number in the international digits-only form wa.me expects
// ("584141234567"), or null when it can't be one. Phone numbers are stored as
// typed, and the business is Venezuelan, so local formats default to +58:
//   "0414-123.45.67" -> 584141234567 (national 0 prefix)
//   "414 1234567"    -> 584141234567 (mobile number without prefix)
//   "+58 414..." / "0058 414..." -> kept as international
export function toWhatsAppNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = `58${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith("4")) {
    digits = `58${digits}`;
  }

  // E.164 numbers have at most 15 digits; shorter than 11 can't include
  // both a country code and a full subscriber number
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

// "584141234567" -> "+58 414 1234567", for showing which chat will open
export function formatWhatsAppNumber(digits: string) {
  if (digits.startsWith("58") && digits.length === 12) {
    return `+58 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  return `+${digits}`;
}
