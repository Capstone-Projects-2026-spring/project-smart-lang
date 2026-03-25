import $ from "../externals/jquery.js";

const STORAGE_KEY = "SMART_LANG_AUTH_USER";

let authService = {};

authService.EVENT_AUTH_CHANGED = "authChanged";

authService.isLoggedIn = function () {
  return authService.getCurrentUser() !== null;
};

authService.getCurrentUser = function () {
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

authService.isCaregiver = function () {
  let user = authService.getCurrentUser();
  return user !== null && user.role === "caregiver";
};

authService.isStudent = function () {
  let user = authService.getCurrentUser();
  return user !== null && user.role === "student";
};

authService.login = function (userInfo) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
  $(document).trigger(authService.EVENT_AUTH_CHANGED);
};

authService.logout = function () {
  window.localStorage.removeItem(STORAGE_KEY);
  $(document).trigger(authService.EVENT_AUTH_CHANGED);
};

authService.generateStudentId = function () {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "ST-";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

export { authService };
