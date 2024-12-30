const db = require('../db')

class RecommendationEngine {
  constructor() {
    this.impactFactors = {
      social_circle: {
        weight: 0.4,
        metrics: ['historical_energy_impact', 'recovery_time'],
      },
      time_of_day: {
        weight: 0.3,
        metrics: ['energy_level_variance', 'preferred_times'],
      },
      duration: {
        weight: 0.3,
        metrics: ['fatigue_threshold', 'optimal_duration'],
      },
    }

    this.recoveryPatterns = {
      high_impact: {
        threshold: -3,
        recommended_recovery: '24_hours',
        notification_frequency: 'increased',
      },
      moderate_impact: {
        threshold: -2,
        recommended_recovery: '12_hours',
        notification_frequency: 'normal',
      },
    }
  }

  async generateRecommendations({ patterns, insights, userId }) {
    try {
      const recommendations = []

      // Get user's recent data for context
      const [recentEvents, recentCheckIns] = await Promise.all([
        this._getRecentEvents(userId),
        this._getRecentCheckIns(userId),
      ])

      // Social circle recommendations
      const socialCircleRecs = await this._generateSocialCircleRecommendations(
        patterns,
        recentEvents,
        recentCheckIns
      )
      recommendations.push(...socialCircleRecs)

      // Timing recommendations
      const timingRecs = this._generateTimingRecommendations(
        patterns,
        recentEvents,
        recentCheckIns
      )
      recommendations.push(...timingRecs)

      // Recovery recommendations
      const recoveryRecs = this._generateRecoveryRecommendations(
        patterns,
        recentCheckIns
      )
      recommendations.push(...recoveryRecs)

      // Activity balance recommendations
      const balanceRecs = this._generateActivityBalanceRecommendations(
        insights,
        recentEvents
      )
      recommendations.push(...balanceRecs)

      return this._prioritizeRecommendations(recommendations)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw error
    }
  }

  async _getRecentEvents(userId) {
    return db('events')
      .where('user_id', userId)
      .orderBy('date', 'desc')
      .limit(30)
  }

  async _getRecentCheckIns(userId) {
    return db('check_ins')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(30)
  }

  async _generateSocialCircleRecommendations(patterns, events, checkIns) {
    const recommendations = []
    const socialImpacts = patterns.filter((p) => p.type === 'social_impact')

    for (const impact of socialImpacts) {
      if (impact.value > 2) {
        recommendations.push({
          type: 'social',
          description: `Consider scheduling more events with ${impact.social_circle_name}. These interactions appear to boost your energy levels.`,
          priority: 'high',
        })
      } else if (impact.value < -2) {
        recommendations.push({
          type: 'social',
          description: `Consider shorter or less frequent interactions with ${impact.social_circle_name} to better manage your energy levels.`,
          priority: 'medium',
        })
      }
    }

    return recommendations
  }

  _generateTimingRecommendations(patterns, events, checkIns) {
    const recommendations = []
    const timePatterns = patterns.filter((p) => p.type === 'time_preference')

    // Analyze optimal times
    const optimalTimes = timePatterns.reduce((acc, pattern) => {
      if (pattern.confidence > 0.7) {
        acc.push({
          timeOfDay: pattern.time_of_day,
          impact: pattern.value,
        })
      }
      return acc
    }, [])

    if (optimalTimes.length > 0) {
      const bestTime = optimalTimes.sort((a, b) => b.impact - a.impact)[0]
      recommendations.push({
        type: 'timing',
        description: `Your energy levels tend to be highest during ${bestTime.timeOfDay}. Consider scheduling important activities during this time.`,
        priority: 'high',
      })
    }

    return recommendations
  }

  _generateRecoveryRecommendations(patterns, checkIns) {
    const recommendations = []
    const energyPatterns = patterns.filter((p) => p.type === 'energy_impact')

    for (const pattern of energyPatterns) {
      if (pattern.value <= this.recoveryPatterns.high_impact.threshold) {
        recommendations.push({
          type: 'recovery',
          description: `After high-impact activities, schedule at least ${this.recoveryPatterns.high_impact.recommended_recovery.replace(
            '_',
            ' '
          )} for recovery.`,
          priority: 'high',
        })
      } else if (
        pattern.value <= this.recoveryPatterns.moderate_impact.threshold
      ) {
        recommendations.push({
          type: 'recovery',
          description: `Consider taking ${this.recoveryPatterns.moderate_impact.recommended_recovery.replace(
            '_',
            ' '
          )} between moderately demanding activities.`,
          priority: 'medium',
        })
      }
    }

    return recommendations
  }

  _generateActivityBalanceRecommendations(insights, events) {
    const recommendations = []

    // Check activity distribution
    const activityTypes = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {})

    const totalActivities = Object.values(activityTypes).reduce(
      (a, b) => a + b,
      0
    )
    const threshold = 0.4 // 40% threshold for imbalance

    for (const [type, count] of Object.entries(activityTypes)) {
      const percentage = count / totalActivities
      if (percentage > threshold) {
        recommendations.push({
          type: 'balance',
          description: `Your schedule shows a high concentration of ${type} activities. Consider diversifying your activities for better energy management.`,
          priority: 'medium',
        })
      }
    }

    return recommendations
  }

  _prioritizeRecommendations(recommendations) {
    // Sort by priority (high > medium > low)
    const priorityOrder = { high: 0, medium: 1, low: 2 }

    return (
      recommendations
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        // Limit to top 5 recommendations to avoid overwhelming the user
        .slice(0, 5)
    )
  }
}

module.exports = RecommendationEngine
