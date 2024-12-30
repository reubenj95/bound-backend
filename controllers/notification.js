const WebSocket = require('ws')
const db = require('../db')
const { validateNotification } = require('../middleware/validation')
const { formatResponse } = require('../utils/responseFormatter')
const NotificationService = require('../services/NotificationService')
const NotificationFactory = require('../services/NotificationFactory')

class NotificationController {
  constructor() {
    this.notificationService = new NotificationService()
    this.notificationFactory = new NotificationFactory()
    this.wsClients = new Map() // Store WebSocket connections
  }

  // WebSocket connection handling
  handleWebSocket(ws, req) {
    const userId = this.getUserIdFromRequest(req)
    if (!userId) {
      ws.close(4001, 'Unauthorized')
      return
    }

    this.wsClients.set(userId, ws)

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message)
        await this.handleWebSocketMessage(userId, data)
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: error.message,
          })
        )
      }
    })

    ws.on('close', () => {
      this.wsClients.delete(userId)
    })
  }

  async handleWebSocketMessage(userId, data) {
    const { type, payload } = data
    const ws = this.wsClients.get(userId)

    switch (type) {
      case 'notification_ack':
        await this.markNotificationDelivered(payload.notificationId)
        break
      case 'notification_response':
        await this.handleNotificationResponse(payload)
        break
      default:
        ws.send(
          JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
          })
        )
    }
  }

  // REST Endpoints
  async create(req, res) {
    try {
      const notification = req.body
      await validateNotification(notification)

      // Create notification using factory
      const notificationInstance = this.notificationFactory.createNotification(
        notification.type,
        notification.data
      )

      // Save to database
      const result = await db('notifications')
        .insert({
          ...notification,
          status: 'pending',
        })
        .returning('*')

      // Send through appropriate channel
      await this.notificationService.send(notificationInstance)

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

  async getPending(req, res) {
    try {
      const { userId } = req.params
      const notifications = await db('notifications')
        .where({
          user_id: userId,
          status: 'pending',
        })
        .orderBy('created_at', 'desc')

      return formatResponse(res, 200, {
        success: true,
        data: notifications,
      })
    } catch (error) {
      return formatResponse(res, 500, {
        success: false,
        error: error.message,
      })
    }
  }

  async updatePreferences(req, res) {
    try {
      const { userId } = req.params
      const preferences = req.body

      const result = await db('notification_preferences')
        .where({ user_id: userId })
        .update(preferences)
        .returning('*')

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

  async getChannelConfig(req, res) {
    try {
      const { userId } = req.params
      const config = await db('notification_channels')
        .where({ user_id: userId })
        .first()

      return formatResponse(res, 200, {
        success: true,
        data: config,
      })
    } catch (error) {
      return formatResponse(res, 500, {
        success: false,
        error: error.message,
      })
    }
  }

  async updateChannelConfig(req, res) {
    try {
      const { userId } = req.params
      const config = req.body

      const result = await db('notification_channels')
        .where({ user_id: userId })
        .update(config)
        .returning('*')

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

  // Helper methods
  async markNotificationDelivered(notificationId) {
    await db('notifications').where({ id: notificationId }).update({
      status: 'delivered',
      delivered_at: new Date(),
    })
  }

  async handleNotificationResponse(payload) {
    const { notificationId, response, userId } = payload

    await db('notification_responses').insert({
      notification_id: notificationId,
      user_id: userId,
      response,
      responded_at: new Date(),
    })

    // Update notification status
    await db('notifications').where({ id: notificationId }).update({
      status: 'responded',
      response_data: response,
    })

    // Trigger any follow-up actions based on response
    await this.notificationService.handleResponse(notificationId, response)
  }

  getUserIdFromRequest(req) {
    // Extract user ID from authentication token or session
    // Implementation depends on your authentication system
    return req.user?.id
  }

  // Push notification methods
  async registerPushToken(req, res) {
    try {
      const { userId, token, platform } = req.body

      await db('push_tokens')
        .insert({
          user_id: userId,
          token,
          platform,
          created_at: new Date(),
        })
        .onConflict(['user_id', 'token'])
        .merge()

      return formatResponse(res, 200, {
        success: true,
        message: 'Push token registered successfully',
      })
    } catch (error) {
      return formatResponse(res, 400, {
        success: false,
        error: error.message,
      })
    }
  }

  async unregisterPushToken(req, res) {
    try {
      const { token } = req.body

      await db('push_tokens').where({ token }).delete()

      return formatResponse(res, 200, {
        success: true,
        message: 'Push token unregistered successfully',
      })
    } catch (error) {
      return formatResponse(res, 400, {
        success: false,
        error: error.message,
      })
    }
  }
}

module.exports = new NotificationController()
