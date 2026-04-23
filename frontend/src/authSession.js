import axios from 'axios';
import { isValidSubjectId } from './subjects.js';

export const TOKEN_KEY = 'ezStudy_token';
export const USER_KEY = 'ezStudy_user';

const DEFAULT_SUBJECT = 'mathematics';

/**
 * Decode JWT payload (no signature verification — use only for expiry + display;
 * server still verifies on each API call).
 */
export function decodeJwtPayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(payload) {
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function normalizeUserFromPayloadAndStorage(payload, stored) {
  const id = String(stored?.id ?? payload?.id ?? payload?.sub ?? '');
  const email = String(stored?.email ?? payload?.email ?? '');
  let subject = stored?.subject ?? payload?.subject;
  if (!isValidSubjectId(subject)) {
    subject = DEFAULT_SUBJECT;
  }
  return { id, email, subject };
}

export function readSessionFromStorage() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return { isLoggedIn: false, user: null };
  }

  const payload = decodeJwtPayload(token);
  if (!payload || isJwtExpired(payload)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
    return { isLoggedIn: false, user: null };
  }

  let stored = null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = null;
  }

  const user = normalizeUserFromPayloadAndStorage(payload, stored);

  if (!user.id || !user.email) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete axios.defaults.headers.common['Authorization'];
    return { isLoggedIn: false, user: null };
  }

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return { isLoggedIn: true, user };
}

export function persistAuthSession(token, user) {
  const normalized = {
    id: user.id,
    email: user.email,
    subject: isValidSubjectId(user.subject) ? user.subject : DEFAULT_SUBJECT,
  };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete axios.defaults.headers.common['Authorization'];
}
