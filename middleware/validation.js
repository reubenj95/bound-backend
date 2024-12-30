const Joi = require('joi')

// Schema definitions
const schemas = {
  checkIn: Joi.object({
    user_id: Joi.string().required(),
    energy_level: Joi.number().min(1).max(10).required(),
    mood: Joi.string().required(),
    notes: Joi.string().allow('').optional(),
    activity_type: Joi.string().required(),
    social_interaction_level: Joi.number().min(1).max(10).optional(),
    created_at: Joi.date().default(Date.now),
  }),

  notification: Joi.object({
    user_id: Joi.string().required(),
    type: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    priority: Joi.string().valid('low', 'medium', 'high').required(),
    data: Joi.object().optional(),
    delivery_time: Joi.date().optional(),
  }),

  notificationPreference: Joi.object({
    user_id: Joi.string().required(),
    email_enabled: Joi.boolean().default(true),
    push_enabled: Joi.boolean().default(true),
    quiet_hours_start: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    quiet_hours_end: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    notification_types: Joi.object({
      check_in_reminders: Joi.boolean().default(true),
      energy_alerts: Joi.boolean().default(true),
      pattern_insights: Joi.boolean().default(true),
    }).default(),
  }),

  channelConfig: Joi.object({
    user_id: Joi.string().required(),
    email: Joi.string().email().optional(),
    push_token: Joi.string().optional(),
    webhook_url: Joi.string().uri().optional(),
    slack_webhook: Joi.string().uri().optional(),
  }),

  analysisRequest: Joi.object({
    user_id: Joi.string().required(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    metrics: Joi.array().items(Joi.string()).optional(),
    categories: Joi.array().items(Joi.string()).optional(),
  }),

  reportRequest: Joi.object({
    user_id: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
    sections: Joi.array()
      .items(Joi.string().valid('patterns', 'insights', 'recommendations'))
      .default(['patterns', 'insights', 'recommendations']),
  }),
}

// Validation middleware functions
const validateCheckIn = async (checkIn) => {
  try {
    await schemas.checkIn.validateAsync(checkIn, { abortEarly: false })
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

const validateNotification = async (notification) => {
  try {
    await schemas.notification.validateAsync(notification, {
      abortEarly: false,
    })
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

const validateNotificationPreference = async (preferences) => {
  try {
    await schemas.notificationPreference.validateAsync(preferences, {
      abortEarly: false,
    })
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

const validateChannelConfig = async (config) => {
  try {
    await schemas.channelConfig.validateAsync(config, { abortEarly: false })
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

const validateAnalysisRequest = async (request) => {
  try {
    await schemas.analysisRequest.validateAsync(request, { abortEarly: false })
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

const validateReportRequest = async (request) => {
  try {
    await schemas.reportRequest.validateAsync(request, { abortEarly: false })
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`)
  }
}

// Request validation middleware
const validateRequest = (schemaName) => {
  return async (req, res, next) => {
    try {
      const schema = schemas[schemaName]
      if (!schema) {
        throw new Error(`Schema ${schemaName} not found`)
      }

      req.body = await schema.validateAsync(req.body, { abortEarly: false })
      next()
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${error.message}`,
      })
    }
  }
}

module.exports = {
  validateCheckIn,
  validateNotification,
  validateNotificationPreference,
  validateChannelConfig,
  validateAnalysisRequest,
  validateReportRequest,
  validateRequest,
}
