import { generatePublicId, isValidPublicId, generateCrockfordSuffix, CROCKFORD_BASE32 } from './publicId';

describe('publicId generation and validation', () => {
  it('generates a valid public ID', () => {
    const id = generatePublicId();
    expect(id).toMatch(/^@[a-z]+-[a-z]+-[a-z]+-[a-z]+-[0-9A-HJKMNPQRSTVWXYZ]{5}$/);
    expect(isValidPublicId(id)).toBe(true);
  });

  it('generates multiple unique IDs (mostly)', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generatePublicId());
    }
    // Very low probability of collision in 100 iterations
    expect(ids.size).toBe(100);
  });

  it('Crockford suffix does not contain I, L, O, or U', () => {
    const suffix = generateCrockfordSuffix(100);
    expect(suffix).not.toMatch(/[ILOU]/);
    
    // Ensure all chars are from the defined base32 set
    for (let i = 0; i < suffix.length; i++) {
      expect(CROCKFORD_BASE32.includes(suffix[i])).toBe(true);
    }
  });

  it('isValidPublicId rejects invalid formats', () => {
    expect(isValidPublicId(null)).toBe(false);
    expect(isValidPublicId('')).toBe(false);
    
    // Missing prefix
    expect(isValidPublicId('happy-dog-at-park-12345')).toBe(false);
    
    // Wrong suffix length
    expect(isValidPublicId('@happy-dog-at-park-1234')).toBe(false);
    expect(isValidPublicId('@happy-dog-at-park-123456')).toBe(false);
    
    // Invalid suffix character
    expect(isValidPublicId('@happy-dog-at-park-1234O')).toBe(false);
    
    // Words not in the lists
    expect(isValidPublicId('@notanadjective-dog-at-park-12345')).toBe(false);
  });
});
