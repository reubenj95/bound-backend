class NotificationFactory {
  createNotification(type, data) {
    switch (type) {
      case 'event_reminder':
        return this.createEventReminder(data)
      case 'check_in_prompt':
        return this.createCheckInPrompt(data)
      case 'insight_share':
        return this.createInsightShare(data)
      case 'pattern_alert':
        return this.createPatternAlert(data)
      case 'social_update':
        return this.createSocialUpdate(data)
      default:
        throw new Error(`Unknown notification type: ${type}`)
    }
  }

  createEventReminder(data) {
    const { event_id, event_name, start_time, location } = data
    return {
      type: 'event_reminder',
      title: 'Event Reminder',
      message: `Don't forget: ${event_name} is starting ${this.formatTime(
        start_time
      )}${location ? ` at ${location}` : ''}`,
      data: {
        event_id,
        event_name,
        start_time,
        location,
      },
      actions: [
        {
          label: 'View Event',
          action: 'view_event',
          data: { event_id },
        },
        {
          label: "I'll be there",
          action: 'rsvp',
          data: { event_id, response: 'attending' },
        },
        {
          label: "Can't make it",
          action: 'rsvp',
          data: { event_id, response: 'declined' },
        },
      ],
    }
  }

  createCheckInPrompt(data) {
    const { check_in_id, prompt_type } = data
    let message = ''
    let actions = []

    switch (prompt_type) {
      case 'energy_level':
        message = 'How are your energy levels right now?'
        actions = [
          { label: 'Very Low', action: 'energy_response', data: { level: 1 } },
          { label: 'Low', action: 'energy_response', data: { level: 2 } },
          { label: 'Moderate', action: 'energy_response', data: { level: 3 } },
          { label: 'High', action: 'energy_response', data: { level: 4 } },
          { label: 'Very High', action: 'energy_response', data: { level: 5 } },
        ]
        break
      case 'mood':
        message = 'How are you feeling?'
        actions = [
          {
            label: '😊 Great',
            action: 'mood_response',
            data: { mood: 'great' },
          },
          { label: '😌 Good', action: 'mood_response', data: { mood: 'good' } },
          { label: '😐 Okay', action: 'mood_response', data: { mood: 'okay' } },
          {
            label: '😕 Not Great',
            action: 'mood_response',
            data: { mood: 'not_great' },
          },
          {
            label: '😢 Struggling',
            action: 'mood_response',
            data: { mood: 'struggling' },
          },
        ]
        break
    }

    return {
      type: 'check_in_prompt',
      title: 'Quick Check-in',
      message,
      data: {
        check_in_id,
        prompt_type,
      },
      actions,
    }
  }

  createInsightShare(data) {
    const { insight_id, insight_type, content } = data
    return {
      type: 'insight_share',
      title: 'New Insight',
      message: content,
      data: {
        insight_id,
        insight_type,
      },
      actions: [
        {
          label: 'View Details',
          action: 'view_insight',
          data: { insight_id },
        },
        {
          label: 'This is helpful',
          action: 'insight_feedback',
          data: { insight_id, feedback: 'helpful' },
        },
        {
          label: 'Not relevant',
          action: 'insight_feedback',
          data: { insight_id, feedback: 'not_relevant' },
        },
      ],
    }
  }

  createPatternAlert(data) {
    const { pattern_id, pattern_type, description } = data
    return {
      type: 'pattern_alert',
      title: 'Pattern Detected',
      message: description,
      data: {
        pattern_id,
        pattern_type,
      },
      actions: [
        {
          label: 'View Pattern',
          action: 'view_pattern',
          data: { pattern_id },
        },
        {
          label: 'Acknowledge',
          action: 'pattern_response',
          data: { pattern_id, response: 'acknowledged' },
        },
      ],
    }
  }

  createSocialUpdate(data) {
    const { update_type, content, related_id } = data
    return {
      type: 'social_update',
      title: this.getSocialUpdateTitle(update_type),
      message: content,
      data: {
        update_type,
        related_id,
      },
      actions: this.getSocialUpdateActions(update_type, related_id),
    }
  }

  // Helper methods
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow =
      new Date(now.setDate(now.getDate() + 1)).toDateString() ===
      date.toDateString()

    let timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

    if (isToday) {
      return `today at ${timeStr}`
    } else if (isTomorrow) {
      return `tomorrow at ${timeStr}`
    } else {
      return `on ${date.toLocaleDateString()} at ${timeStr}`
    }
  }

  getSocialUpdateTitle(updateType) {
    const titles = {
      new_member: 'New Social Circle Member',
      circle_update: 'Social Circle Update',
      interaction_reminder: 'Connection Reminder',
      milestone: 'Relationship Milestone',
    }
    return titles[updateType] || 'Social Update'
  }

  getSocialUpdateActions(updateType, relatedId) {
    const baseActions = [
      {
        label: 'View Details',
        action: 'view_social_update',
        data: { update_type: updateType, related_id: relatedId },
      },
    ]

    switch (updateType) {
      case 'new_member':
        return [
          ...baseActions,
          {
            label: 'Welcome',
            action: 'send_welcome',
            data: { member_id: relatedId },
          },
        ]
      case 'interaction_reminder':
        return [
          ...baseActions,
          {
            label: 'Schedule Meeting',
            action: 'schedule_interaction',
            data: { member_id: relatedId },
          },
        ]
      default:
        return baseActions
    }
  }
}

module.exports = NotificationFactory
