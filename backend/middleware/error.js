const ApiError = require('../utils/ApiError');
const Response = require('../utils/response');
const config = require('../config');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
    }));
    error = ApiError.badRequest('数据验证失败', errors);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} 已存在`,
    }));
    error = ApiError.conflict('数据冲突', errors);
  }

  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('无效的令牌');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('登录已过期');
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    error = ApiError.badRequest(`文件大小超过限制，最大支持 ${Math.round(config.upload.maxFileSize / 1024 / 1024)}MB`);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = ApiError.badRequest('上传的文件字段名不正确');
  }

  if (!error.isOperational) {
    console.error('Error:', error);
    error = ApiError.internal('服务器内部错误');
  }

  Response.error(res, error);
};

const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound('接口不存在'));
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
