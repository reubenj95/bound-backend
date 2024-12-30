const db = require('../db')
const { validateCheckIn } = require('../middleware/validation')
const { rateLimit } = require('../middleware/rateLimit')
const { formatResponse } = require('../utils/responseFormatter')

// Export the controller methods directly instead of a class instance
exports.create = async (req, res) => {
  try {
    const checkIn = req.body
    await validateCheckIn(checkIn)

    const result = await db('check_ins').insert(checkIn).returning('*')

    return formatResponse(res, 201, {
      success: true,
      data: result[0],
    })
  } catch (error) {
    return formatResponse(res, 400, {
      success: false,
      error: error.message,
    })
  }
}

exports.get = async (req, res) => {
  try {
    const { id } = req.params
    const checkIn = await db('check_ins').where({ id }).first()

    if (!checkIn) {
      return formatResponse(res, 404, {
        success: false,
        error: 'Check-in not found',
      })
    }

    return formatResponse(res, 200, {
      success: true,
      data: checkIn,
    })
  } catch (error) {
    return formatResponse(res, 500, {
      success: false,
      error: error.message,
    })
  }
}

exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      order = 'desc',
    } = req.query
    const offset = (page - 1) * limit

    const checkIns = await db('check_ins')
      .orderBy(sortBy, order)
      .limit(limit)
      .offset(offset)

    const total = await db('check_ins').count('id as count').first()

    return formatResponse(res, 200, {
      success: true,
      data: checkIns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
      },
    })
  } catch (error) {
    return formatResponse(res, 500, {
      success: false,
      error: error.message,
    })
  }
}

exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    await validateCheckIn(updates)

    const result = await db('check_ins')
      .where({ id })
      .update(updates)
      .returning('*')

    if (!result.length) {
      return formatResponse(res, 404, {
        success: false,
        error: 'Check-in not found',
      })
    }

    return formatResponse(res, 200, {
      success: true,
      data: result[0],
    })
  } catch (error) {
    return formatResponse(res, 400, {
      success: false,
      error: error.message,
    })
  }
}

exports.delete = async (req, res) => {
  try {
    const { id } = req.params
    const result = await db('check_ins').where({ id }).delete()

    if (!result) {
      return formatResponse(res, 404, {
        success: false,
        error: 'Check-in not found',
      })
    }

    return formatResponse(res, 200, {
      success: true,
      message: 'Check-in deleted successfully',
    })
  } catch (error) {
    return formatResponse(res, 500, {
      success: false,
      error: error.message,
    })
  }
}

exports.getPatterns = async (req, res) => {
  try {
    const { userId, timeframe = '30d' } = req.query

    // Convert timeframe to date
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeframe))

    const patterns = await db('check_ins')
      .where('user_id', userId)
      .where('created_at', '>=', startDate)
      .select('energy_level', 'mood', 'activity_type', 'created_at')
      .orderBy('created_at', 'asc')

    return formatResponse(res, 200, {
      success: true,
      data: patterns,
    })
  } catch (error) {
    return formatResponse(res, 500, {
      success: false,
      error: error.message,
    })
  }
}

exports.predictImpact = async (req, res) => {
  try {
    const { eventType, userId, timing } = req.body

    // Simple response for now
    return formatResponse(res, 200, {
      success: true,
      data: {
        predictedImpact: 'moderate',
        confidence: 0.7,
        factors: ['time of day', 'recent activity patterns'],
      },
    })
  } catch (error) {
    return formatResponse(res, 500, {
      success: false,
      error: error.message,
    })
  }
}

exports.batchCreate = async (req, res) => {
  try {
    const checkIns = req.body
    if (!Array.isArray(checkIns)) {
      throw new Error('Request body must be an array of check-ins')
    }

    // Validate all check-ins
    await Promise.all(checkIns.map(validateCheckIn))

    const result = await db('check_ins').insert(checkIns).returning('*')

    return formatResponse(res, 201, {
      success: true,
      data: result,
    })
  } catch (error) {
    return formatResponse(res, 400, {
      success: false,
      error: error.message,
    })
  }
}

exports.export = async (req, res) => {
  try {
    const { format = 'json', timeframe = '30d' } = req.query

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeframe))

    const data = await db('check_ins')
      .where('created_at', '>=', startDate)
      .select('*')
      .orderBy('created_at', 'desc')

    let exportData
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = convertToCSV(data)
        res.header('Content-Type', 'text/csv')
        res.attachment('check-ins.csv')
        break
      case 'json':
      default:
        exportData = JSON.stringify(data, null, 2)
        res.header('Content-Type', 'application/json')
        res.attachment('check-ins.json')
        break
    }

    return res.send(exportData)
  } catch (error) {
    return formatResponse(res, 500, {
      success: false,
      error: error.message,
    })
  }
}

// Helper function
function convertToCSV(data) {
  if (!data.length) return ''

  const headers = Object.keys(data[0])
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(','))

  // Add data
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header]
      return typeof val === 'string' ? `"${val}"` : val
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}
