exports.authorizeRoles = (...roles) => {
  const normalize = (s) => (s ? String(s).trim().toLowerCase() : '');
  const allowed = roles.map((r) => normalize(r));
  return (req, res, next) => {
    const userRole = normalize(req.user && req.user.role);
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ message: `Role (${req.user?.role}) not authorized` });
    }
    next();
  };
};
