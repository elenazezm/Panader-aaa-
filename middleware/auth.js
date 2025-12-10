function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.isAdmin) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
}

module.exports = { requireAuth, requireAdmin };