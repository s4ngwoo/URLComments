jest.mock('./ui.js', () => ({
  showError: jest.fn(),
}));

import { showError } from './ui.js';
import {
  ensureProfile,
  updateDisplayName,
  normalizeDisplayName,
  validateDisplayName,
} from './profile.js';
import { state, resetState } from './state.js';

function mockProfilesClient({ fetch, insert }) {
  const insertFn = jest.fn((rows) => ({
    select: () => ({
      single: () => Promise.resolve(insert(rows)),
    }),
  }));
  const updateEq = jest.fn();
  return {
    from: jest.fn(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(fetch),
        }),
      }),
      insert: insertFn,
      update: (payload) => ({
        eq: (col, id) => {
          updateEq({ payload, col, id });
          return {
            select: () => ({
              single: () => Promise.resolve({
                data: { id, display_name: payload.display_name, public_id: '@abc' },
                error: null,
              }),
            }),
          };
        },
      }),
    })),
    insertFn,
    updateEq,
  };
}

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

describe('ensureProfile', () => {
  const user = {
    id: 'user-1',
    email: 'ada@example.com',
    user_metadata: { full_name: '  Ada Lovelace  ' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetState();
    window.supabaseClient = null;
  });

  it('returns an existing profile without inserting', async () => {
    const existing = { id: 'user-1', display_name: 'Ada', public_id: '@ADA1' };
    const client = mockProfilesClient({
      fetch: { data: existing, error: null },
      insert: () => ({ data: null, error: { message: 'should not insert' } }),
    });
    window.supabaseClient = client;

    const result = await ensureProfile(user);
    expect(result).toEqual(existing);
    expect(state.currentProfile).toEqual(existing);
    expect(client.insertFn).not.toHaveBeenCalled();
  });

  it('creates a profile when none exists (PGRST116)', async () => {
    const created = { id: 'user-1', display_name: 'Ada Lovelace', public_id: '@NEW1' };
    const client = mockProfilesClient({
      fetch: { data: null, error: { code: 'PGRST116', message: 'not found' } },
      insert: (rows) => ({ data: { ...created, ...rows[0] }, error: null }),
    });
    window.supabaseClient = client;

    const result = await ensureProfile(user);
    expect(client.insertFn).toHaveBeenCalledTimes(1);
    const inserted = client.insertFn.mock.calls[0][0][0];
    expect(inserted.id).toBe('user-1');
    expect(inserted.display_name).toBe('Ada Lovelace');
    expect(inserted.public_id).toMatch(/^@/);
    expect(result.display_name).toBe('Ada Lovelace');
    expect(state.currentProfile.display_name).toBe('Ada Lovelace');
  });

  it('retries unique public_id collisions then succeeds', async () => {
    let inserts = 0;
    const client = mockProfilesClient({
      fetch: { data: null, error: { code: 'PGRST116' } },
      insert: () => {
        inserts += 1;
        if (inserts < 3) {
          return { data: null, error: { code: '23505', message: 'duplicate' } };
        }
        return { data: { id: 'user-1', display_name: 'Ada Lovelace', public_id: '@OK' }, error: null };
      },
    });
    window.supabaseClient = client;

    const result = await ensureProfile(user);
    expect(client.insertFn).toHaveBeenCalledTimes(3);
    expect(result.public_id).toBe('@OK');
  });

  it('fails closed on a non-116 fetch error without inserting', async () => {
    const client = mockProfilesClient({
      fetch: { data: null, error: { code: '42501', message: 'rls' } },
      insert: () => ({ data: null, error: null }),
    });
    window.supabaseClient = client;

    const result = await ensureProfile(user);
    expect(result).toBeNull();
    expect(state.currentProfile).toBeNull();
    expect(client.insertFn).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('profileSetupFailed');
  });

  it('gives up after five public_id collisions', async () => {
    const client = mockProfilesClient({
      fetch: { data: null, error: { code: 'PGRST116' } },
      insert: () => ({ data: null, error: { code: '23505' } }),
    });
    window.supabaseClient = client;

    const result = await ensureProfile(user);
    expect(result).toBeNull();
    expect(client.insertFn).toHaveBeenCalledTimes(5);
    expect(showError).toHaveBeenCalledWith('profileSetupFailed');
  });
});

describe('updateDisplayName', () => {
  beforeEach(() => {
    resetState();
    state.currentUser = { id: 'user-1' };
  });

  it('rejects an invalid name before writing', async () => {
    window.supabaseClient = { from: jest.fn() };
    await expect(updateDisplayName('   ')).rejects.toThrow('Invalid display name');
    expect(window.supabaseClient.from).not.toHaveBeenCalled();
  });

  it('updates the current user profile', async () => {
    const client = mockProfilesClient({
      fetch: { data: null, error: { code: 'PGRST116' } },
      insert: () => ({ data: null, error: null }),
    });
    window.supabaseClient = client;

    const result = await updateDisplayName('  New Name  ');
    expect(client.updateEq).toHaveBeenCalledWith({
      payload: { display_name: 'New Name' },
      col: 'id',
      id: 'user-1',
    });
    expect(result.display_name).toBe('New Name');
    expect(state.currentProfile.display_name).toBe('New Name');
  });
});
