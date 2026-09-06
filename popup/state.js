export const state = {
  normalizedCurrentUrl: null,
  currentUser: null,
  isSpaDomain: false,
};

export function setSpaDomain(value) {
  state.isSpaDomain = value;
}

export function setNormalizedUrl(url) {
  state.normalizedCurrentUrl = url;
}

export function setCurrentUser(user) {
  state.currentUser = user;
}

export function resetState() {
  state.normalizedCurrentUrl = null;
  state.currentUser = null;
  state.isSpaDomain = false;
}
