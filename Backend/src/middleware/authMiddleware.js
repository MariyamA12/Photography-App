// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { rotateRefreshToken } = require('../services/userService');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
};

async function authMiddleware(req, res, next) {
  // 1) Try access token from cookie (web)
  let accessToken = req.cookies.token;

  // 2) Fallback to Authorization header (mobile)
  if (!accessToken) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7);
    }
  }

  // 3) Verify access token if present
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.user = decoded; // { userId, role }
      return next();
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        return res.status(401).json({ message: 'Invalid access token' });
      }
      // If expired, fall through to refresh flow
    }
  }

  // 4) Rotate refresh token from cookie or body
  const oldRefresh = req.cookies.refreshToken || req.body.refreshToken;
  if (!oldRefresh) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const { accessToken: newAccess, refreshToken: newRefresh, user } =
      await rotateRefreshToken(oldRefresh);

    // Set new cookies for web clients
    res
      .cookie('token', newAccess, { ...COOKIE_OPTS, maxAge: 2 * 60 * 60 * 1000 })
      .cookie('refreshToken', newRefresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    // Attach user for both web & mobile
    req.user = { userId: user.id, role: user.role };
    next();
  } catch (err) {
    console.error('Refresh failed:', err.message);
    res.status(401).json({ message: 'Authentication required' });
  }
}

module.exports = authMiddleware;
