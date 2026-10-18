// For register(..., { setValueAs }) on number inputs. `valueAsNumber` turns a
// cleared field into NaN, which fails validation with a technical message;
// these map it to a sensible value instead
export function emptyAsZero(value: string) {
  return value === "" ? 0 : Number(value);
}

export function emptyAsNull(value: string) {
  return value === "" ? null : Number(value);
}
