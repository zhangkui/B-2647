const jwt = require('jsonwebtoken');
const config = require('../config');

const jwtUtil = {
  generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  },

  decodeToken(token) {
    return jwt.decode(token);
  },
};

module.exports = jwtUtil;
