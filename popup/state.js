export const state = {
  normalizedCurrentUrl: null,
  currentUser: null,
  currentProfile: null,
  isSpaDetected: false,
};

export function setSpaDetected(value) {
  state.isSpaDetected = value;
}

export function setNormalizedUrl(url) {
  state.normalizedCurrentUrl = url;
}

export function setCurrentUser(user) {
  state.currentUser = user;
}

export function setCurrentProfile(profile) {
  state.currentProfile = profile;
}

export function resetState() {
  state.normalizedCurrentUrl = null;
  state.currentUser = null;
  state.currentProfile = null;
  state.isSpaDetected = false;
}
