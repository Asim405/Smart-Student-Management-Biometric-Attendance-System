const jwt = require('jsonwebtoken');

// Verifies the Bearer token and attaches { id, role, email } to req.user

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Restricts a route to one or more roles, e.g. requireRole('admin')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Separate, lighter-weight guard for the ESP32 hardware endpoint.
// The device authenticates with a shared secret header, not a JWT,
// since a microcontroller has no login flow of its own.
function verifyDeviceSecret(req, res, next) {
  const key = req.headers['x-device-key'];
  if (!key || key !== process.env.HARDWARE_SHARED_SECRET) {
    return res.status(401).json({ error: 'Invalid device key' });
  }
  next();
}

module.exports = { verifyToken, requireRole, verifyDeviceSecret };
