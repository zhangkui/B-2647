class Response {
  static success(res, data = null, message = '操作成功', statusCode = 200) {
    return res.status(statusCode).json({
      code: 0,
      message,
      data,
    });
  }

  static error(res, error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || '服务器内部错误';

    return res.status(statusCode).json({
      code: statusCode,
      message,
      errors: error.errors || null,
    });
  }

  static paginate(res, data, total, page, pageSize, message = '操作成功') {
    return res.status(200).json({
      code: 0,
      message,
      data: {
        list: data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
}

module.exports = Response;
