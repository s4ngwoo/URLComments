import { state, setCurrentProfile } from './state.js';
import { generatePublicId } from '../lib/publicId.js';
import { showError } from './ui.js';

/**
 * Counts code points to correctly handle emojis and complex characters
 */
export function getCodePointLength(str) {
  return Array.from(str).length;
}

export function normalizeDisplayName(value) {
  if (typeof value !== 'string') return '';
  // Remove newlines and trim
  const cleaned = value.replace(/[\r\n]+/g, ' ').trim();
  
  // Cut to 30 code points
  const chars = Array.from(cleaned);
  return chars.slice(0, 30).join('');
}

export function validateDisplayName(value) {
  if (typeof value !== 'string') return false;
  
  const normalized = value.replace(/[\r\n]+/g, ' ').trim();
  const length = getCodePointLength(normalized);
  
  return length >= 1 && length <= 30;
}

export async function ensureProfile(user) {
  const supabase = window.supabaseClient;
  
  try {
    // 1. Try to fetch existing profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name, public_id')
      .eq('id', user.id)
      .single();
      
    if (!fetchError && profile) {
      setCurrentProfile(profile);
      return profile;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "No rows found". If it's another error, we fail immediately.
      throw fetchError;
    }

    // 2. Profile doesn't exist, try creating one
    
    // Generate fallback display name
    let initialName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      (user.email ? user.email.split('@')[0] : '') || 
                      "User";
                      
    initialName = normalizeDisplayName(initialName);
    if (!initialName) initialName = "User";

    // 3. Retry loop for unique public_id
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      attempts++;
      const candidatePublicId = generatePublicId();
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          display_name: initialName,
          public_id: candidatePublicId
        }])
        .select()
        .single();
        
      if (!insertError && newProfile) {
        setCurrentProfile(newProfile);
        return newProfile;
      }
      
      if (insertError) {
        // Unique violation (23505 in Postgres)
        if (insertError.code === '23505') {
          continue; // Try again
        } else {
          // Other error (e.g., RLS, network)
          throw insertError;
        }
      }
    }
    
    throw new Error('Max retries exceeded for generating public ID');
    
  } catch (error) {
    console.error('Failed to ensure profile:', error);
    // Do not show raw error/UUID to user
    showError(chrome.i18n.getMessage('profileSetupFailed') || "프로필을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    setCurrentProfile(null);
    return null;
  }
}

export async function updateDisplayName(newName) {
  if (!validateDisplayName(newName)) {
    throw new Error('Invalid display name');
  }
  
  const normalized = normalizeDisplayName(newName);
  const supabase = window.supabaseClient;
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: normalized })
    .eq('id', state.currentUser.id)
    .select('id, display_name, public_id')
    .single();
    
  if (error) {
    throw error;
  }
  
  if (data) {
    setCurrentProfile(data);
  }
  
  return data;
}
