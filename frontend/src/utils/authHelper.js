import { jwtDecode } from 'jwt-decode';

export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

const normalize = (s) => (s ? String(s).trim().toLowerCase() : null);

export const hasRole = (user, roles) => {
  if (!user || !roles) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  const normalizedAllowed = allowed.map((r) => normalize(r));

  // role might be at root or nested in user
  const roleCandidates = [user.role, user?.user?.role];
  const userRole = roleCandidates.find((r) => !!r);
  const normalizedUserRole = normalize(userRole);

  return normalizedUserRole && normalizedAllowed.includes(normalizedUserRole);
};
