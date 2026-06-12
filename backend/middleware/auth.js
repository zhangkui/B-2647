const jwtUtil = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw ApiError.unauthorized('请先登录');
    }

    const decoded = jwtUtil.verifyToken(token);
    if (!decoded) {
      throw ApiError.unauthorized('登录已过期，请重新登录');
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw ApiError.unauthorized('用户不存在');
    }

    if (user.status !== 1) {
      throw ApiError.forbidden('账户已被禁用');
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    next(error);
  }
};

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
}

module.exports = authMiddleware;
