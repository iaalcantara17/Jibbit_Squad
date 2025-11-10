export const successResponse = (res, statusCode, data, message = "") => {
  res.status(statusCode).json({ success: true, data, message });
};

export const errorResponse = (res, statusCode, message, fields = []) => {
  res.status(statusCode).json({
    success: false,
    error: { code: statusCode, message, fields }
  });
};

