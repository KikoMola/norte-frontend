import { isValidTaxId, normalizeTaxId } from './tax-id';

describe('tax id', () => {
  it.each([
    '12345678Z',
    'X1234567L',
    'Y1234567X',
    'B12345674',
    'A58818501',
    'P2807900B',
    'Q2826000H',
  ])('accepts %s', (taxId) => expect(isValidTaxId(taxId)).toBe(true));

  it.each(['12345678A', 'X1234567A', 'B12345670', 'P2800000A', '1234', '', 'ZZZZZZZZZ'])(
    'rejects %s',
    (taxId) => expect(isValidTaxId(taxId)).toBe(false),
  );

  it('normalizes case, spaces, dots and dashes', () => {
    expect(normalizeTaxId(' b-12.345.674 ')).toBe('B12345674');
    expect(isValidTaxId('b-12.345.674')).toBe(true);
  });
});
