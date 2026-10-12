class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode >= 200 && statusCode < 300;

    this.statusCode = statusCode;

    this.message = message;

    this.data = data;

    if (meta !== null) {
      this.meta = meta;
    }
  }
}

module.exports = ApiResponse;