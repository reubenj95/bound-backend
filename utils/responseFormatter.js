/**
 * Formats API responses consistently
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
const formatResponse = (res, statusCode, data) => {
  return res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    ...data,
  })
}

module.exports = {
  formatResponse,
}
