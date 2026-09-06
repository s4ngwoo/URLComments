import { state, setSpaDetected, setNormalizedUrl, setCurrentUser, resetState } from './state';

describe('Popup State', () => {
  beforeEach(() => {
    resetState();
  });

  it('should initialize with default values', () => {
    expect(state.isSpaDetected).toBe(false);
    expect(state.normalizedCurrentUrl).toBeNull();
    expect(state.currentUser).toBeNull();
  });

  it('should set SPA domain correctly', () => {
    setSpaDetected(true);
    expect(state.isSpaDetected).toBe(true);
  });

  it('should set normalized URL correctly', () => {
    setNormalizedUrl('https://example.com');
    expect(state.normalizedCurrentUrl).toBe('https://example.com');
  });

  it('should set current user correctly', () => {
    const user = { id: 1, email: 'test@example.com' };
    setCurrentUser(user);
    expect(state.currentUser).toEqual(user);
  });

  it('should reset state correctly', () => {
    setSpaDetected(true);
    setNormalizedUrl('https://example.com');
    setCurrentUser({ id: 1 });
    
    resetState();
    
    expect(state.isSpaDetected).toBe(false);
    expect(state.normalizedCurrentUrl).toBeNull();
    expect(state.currentUser).toBeNull();
  });
});
