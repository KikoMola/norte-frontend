/**
 * NIF español: DNI, NIE, NIF de personas jurídicas (antiguo CIF) y NIF K, L y M.
 * Solo es una ayuda para el usuario: la validación que manda es la del backend (422 `tax_id.invalid`).
 */

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

/** Mayúsculas y sin espacios, puntos ni guiones: «b-12.345.674» → «B12345674». */
export function normalizeTaxId(value: string): string {
  return value.toUpperCase().replace(/[\s.-]/g, '');
}

export function isValidTaxId(value: string): boolean {
  const taxId = normalizeTaxId(value);
  return isValidDni(taxId) || isValidNie(taxId) || isValidKlm(taxId) || isValidCif(taxId);
}

function isValidDni(taxId: string): boolean {
  const match = /^(\d{8})([A-Z])$/.exec(taxId);
  return match !== null && DNI_LETTERS[Number(match[1]) % 23] === match[2];
}

function isValidNie(taxId: string): boolean {
  const match = /^([XYZ])(\d{7})([A-Z])$/.exec(taxId);
  if (!match) {
    return false;
  }
  const number = Number('XYZ'.indexOf(match[1]) + match[2]);
  return DNI_LETTERS[number % 23] === match[3];
}

function isValidKlm(taxId: string): boolean {
  const match = /^[KLM](\d{7})([A-Z])$/.exec(taxId);
  return match !== null && DNI_LETTERS[Number(match[1]) % 23] === match[2];
}

function isValidCif(taxId: string): boolean {
  const match = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(taxId);
  if (!match) {
    return false;
  }
  const [, letter, digits, control] = match;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = Number(digits[i]);
    if (i % 2 === 0) {
      const doubled = digit * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += digit;
    }
  }
  const controlDigit = (10 - (sum % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit];

  if ('PQRSNW'.includes(letter)) {
    return control === controlLetter;
  }
  if ('ABEH'.includes(letter)) {
    return control === String(controlDigit);
  }
  return control === String(controlDigit) || control === controlLetter;
}
