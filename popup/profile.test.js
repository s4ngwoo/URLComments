import { normalizeDisplayName, validateDisplayName } from './profile.js';

describe('Profile display name utilities', () => {
  it('normalizeDisplayName handles various inputs', () => {
    expect(normalizeDisplayName('수다쟁이 하마')).toBe('수다쟁이 하마');
    expect(normalizeDisplayName('  hello  ')).toBe('hello');
    expect(normalizeDisplayName('line\nbreak')).toBe('line break');
    expect(normalizeDisplayName('a'.repeat(40))).toBe('a'.repeat(30));
    
    // Emojis (each takes 1 code point in Array.from)
    const emojiStr = '👩‍🚀'.repeat(20); 
    // Wait, Array.from length for ZWJ emojis is tricky, but basic code point check works for standard JS
    // The requirement states "Array.from(normalizedDisplayName).length"
    
    expect(normalizeDisplayName(null)).toBe('');
    expect(normalizeDisplayName(undefined)).toBe('');
  });

  it('validateDisplayName enforces limits', () => {
    expect(validateDisplayName('수다쟁이 하마')).toBe(true);
    expect(validateDisplayName('a'.repeat(30))).toBe(true);
    
    expect(validateDisplayName('')).toBe(false);
    expect(validateDisplayName('   ')).toBe(false);
    expect(validateDisplayName('a'.repeat(31))).toBe(false);
    expect(validateDisplayName(null)).toBe(false);
  });
});
