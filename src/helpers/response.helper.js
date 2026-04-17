class ApiResponse {
  static success(res, message = "Success", data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res,
    message = "Something went wrong",
    statusCode = 500,
    error = null,
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      error,
    });
  }

  static validationError(res, message = "Validation Error", errors = []) {
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }

  static notFound(res, message = "Not Found") {
    return res.status(404).json({
      success: false,
      message,
    });
  }
}

module.exports = ApiResponse;
