// Lightweight JWT helpers without external deps
// Decode Base64URL
function base64UrlDecode(input) {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const decoded = atob(padded);
    // Handle UTF-8
    const utf8 = decodeURIComponent(
      decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return utf8;
  } catch {
    return '';
  }
}

// Parse JWT payload safely
export function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadStr = base64UrlDecode(parts[1]);
  try {
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

// Extract roles from common claim keys (string or array)
export function extractRolesFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const roleClaimKeys = [
    'role',
    'roles',
    'Role',
    'Roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ];
  for (const key of roleClaimKeys) {
    if (key in payload) {
      const value = payload[key];
      if (Array.isArray(value)) return value.filter(Boolean).map(String);
      if (typeof value === 'string') {
        // Some tokens join roles by comma
        return value.includes(',') ? value.split(',').map(s => s.trim()).filter(Boolean) : [value];
      }
    }
  }
  return [];
}

// Get current token from storage
export function getStoredToken() {
  return localStorage.getItem('authToken') || '';
}

export function getCurrentUserPayload() {
  const token = getStoredToken();
  return decodeJwt(token);
}

export function getUserRoles() {
  const payload = getCurrentUserPayload();
  return extractRolesFromPayload(payload);
}

export function isInRole(targetRole) {
  const roles = getUserRoles();
  return roles.includes(targetRole);
}
