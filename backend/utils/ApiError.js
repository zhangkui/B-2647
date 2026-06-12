class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = '请求参数错误', errors = null) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = '未授权访问') {
    return new ApiError(401, message);
  }

  static forbidden(message = '没有权限访问') {
    return new ApiError(403, message);
  }

  static notFound(message = '资源不存在') {
    return new ApiError(404, message);
  }

  static conflict(message = '资源冲突') {
    return new ApiError(409, message);
  }

  static internal(message = '服务器内部错误') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
