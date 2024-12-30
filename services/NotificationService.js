const db = require('../db')
const WebSocket = require('ws')

class NotificationService {
  constructor() {
    this.channels = {
      websocket: this.sendWebSocket.bind(this),
      email: this.sendEmail.bind(this),
      push: this.sendPushNotification.bind(this),
    }
  }

  async send(notification) {
    try {
      // Get user's channel preferences
      const channelConfig = await db('notification_channels')
        .where({ user_id: notification.user_id })
        .first()

      // Default to websocket if no preferences set
      const channels = channelConfig?.channels || ['websocket']

      // Send through each enabled channel
      for (const channel of channels) {
        if (this.channels[channel]) {
          await this.channels[channel](notification)
        }
      }

      // Update notification status
      await db('notifications')
        .where({ id: notification.id })
        .update({ status: 'sent', sent_at: new Date() })

      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  async handleResponse(notificationId, response) {
    try {
      const notification = await db('notifications')
        .where({ id: notificationId })
        .first()

      if (!notification) {
        throw new Error('Notification not found')
      }

      // Handle different types of responses based on notification type
      switch (notification.type) {
        case 'event_reminder':
          await this.handleEventResponse(notification, response)
          break
        case 'check_in_prompt':
          await this.handleCheckInResponse(notification, response)
          break
        case 'insight_share':
          await this.handleInsightResponse(notification, response)
          break
        // Add more response handlers as needed
      }

      return true
    } catch (error) {
      console.error('Error handling notification response:', error)
      throw error
    }
  }

  // Channel-specific sending methods
  async sendWebSocket(notification) {
    // Implementation would use the WebSocket connection from the controller
    // This is handled in the controller's handleWebSocket method
    return true
  }

  async sendEmail(notification) {
    // Email implementation would go here
    // Would typically use a service like SendGrid or AWS SES
    console.log('Email notification sending not implemented')
    return true
  }

  async sendPushNotification(notification) {
    try {
      // Get user's push tokens
      const tokens = await db('push_tokens')
        .where({ user_id: notification.user_id })
        .select('token', 'platform')

      if (!tokens.length) {
        console.log('No push tokens found for user')
        return false
      }

      // Implementation would use a service like Firebase Cloud Messaging
      // or Apple Push Notification Service
      console.log('Push notification sending not implemented')
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      throw error
    }
  }

  // Response handlers
  async handleEventResponse(notification, response) {
    // Handle event-specific responses (e.g., RSVP)
    await db('events')
      .where({ id: notification.data.event_id })
      .update({ response_status: response })
  }

  async handleCheckInResponse(notification, response) {
    // Handle check-in responses
    await db('check_ins').insert({
      user_id: notification.user_id,
      notification_id: notification.id,
      response_data: response,
      created_at: new Date(),
    })
  }

  async handleInsightResponse(notification, response) {
    // Handle insight-related responses
    await db('insight_responses').insert({
      user_id: notification.user_id,
      notification_id: notification.id,
      response: response,
      created_at: new Date(),
    })
  }
}

module.exports = NotificationService
