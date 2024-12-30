const db = require('../db')

class PatternAnalyzer {
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

  async analyze({ checkIns, events, metrics, eventTypes }) {
    try {
      const patterns = []

      // Analyze energy level patterns
      if (metrics.includes('energy')) {
        const energyPatterns = await this.analyzeEnergyPatterns(
          checkIns,
          events
        )
        patterns.push(...energyPatterns)
      }

      // Analyze social interaction patterns
      if (metrics.includes('social_interaction')) {
        const socialPatterns = await this.analyzeSocialPatterns(events)
        patterns.push(...socialPatterns)
      }

      // Analyze mood patterns
      if (metrics.includes('mood')) {
        const moodPatterns = await this.analyzeMoodPatterns(checkIns)
        patterns.push(...moodPatterns)
      }

      // Store pattern statistics
      await this.storePatternStatistics(patterns, checkIns[0]?.userId)

      return patterns
    } catch (error) {
      console.error('Error in pattern analysis:', error)
      throw error
    }
  }

  async predictImpact({
    eventType,
    date,
    duration,
    participants,
    historicalEvents,
    historicalCheckIns,
  }) {
    try {
      const prediction = {
        energyImpact: 0,
        confidenceScore: 0,
        recoveryPeriod: null,
        recommendations: [],
      }

      // Calculate social circle impact
      const socialImpact = await this.calculateSocialCircleImpact(
        participants,
        historicalEvents
      )
      prediction.energyImpact +=
        socialImpact * this.impactFactors.social_circle.weight

      // Calculate time of day impact
      const timeImpact = this.calculateTimeOfDayImpact(
        date,
        historicalEvents,
        historicalCheckIns
      )
      prediction.energyImpact +=
        timeImpact * this.impactFactors.time_of_day.weight

      // Calculate duration impact
      const durationImpact = this.calculateDurationImpact(
        duration,
        historicalEvents
      )
      prediction.energyImpact +=
        durationImpact * this.impactFactors.duration.weight

      // Determine recovery period
      prediction.recoveryPeriod = this.determineRecoveryPeriod(
        prediction.energyImpact
      )

      // Calculate confidence score based on amount of historical data
      prediction.confidenceScore = this.calculateConfidenceScore(
        historicalEvents,
        historicalCheckIns
      )

      // Generate recommendations
      prediction.recommendations = this.generateRecommendations(prediction)

      return prediction
    } catch (error) {
      console.error('Error in impact prediction:', error)
      throw error
    }
  }

  async analyzeEnergyPatterns(checkIns, events) {
    const patterns = []

    // Group check-ins by day to analyze daily energy patterns
    const dailyEnergy = this.groupByDay(checkIns)

    // Analyze average energy levels by time of day
    const timeOfDayPatterns = this.analyzeTimeOfDayEnergy(dailyEnergy)
    patterns.push({
      type: 'energy_time_of_day',
      patterns: timeOfDayPatterns,
      confidence: this.calculateConfidence(checkIns.length),
    })

    // Analyze event impact on energy
    const eventImpactPatterns = this.analyzeEventImpact(events, checkIns)
    patterns.push({
      type: 'event_energy_impact',
      patterns: eventImpactPatterns,
      confidence: this.calculateConfidence(events.length),
    })

    return patterns
  }

  async analyzeSocialPatterns(events) {
    const patterns = []

    // Group events by social circle
    const socialCircleEvents = this.groupBySocialCircle(events)

    // Analyze energy impact by social circle
    Object.entries(socialCircleEvents).forEach(([circleId, circleEvents]) => {
      const impact = this.calculateAverageImpact(circleEvents)
      patterns.push({
        type: 'social_circle_impact',
        socialCircleId: circleId,
        impact,
        confidence: this.calculateConfidence(circleEvents.length),
      })
    })

    return patterns
  }

  async analyzeMoodPatterns(checkIns) {
    const patterns = []

    // Analyze mood correlation with energy levels
    const moodEnergyCorrelation = this.calculateMoodEnergyCorrelation(checkIns)
    patterns.push({
      type: 'mood_energy_correlation',
      correlation: moodEnergyCorrelation,
      confidence: this.calculateConfidence(checkIns.length),
    })

    return patterns
  }

  async storePatternStatistics(patterns, userId) {
    if (!userId) return

    const timestamp = new Date()
    const patternStats = patterns.map((pattern) => ({
      userId,
      timestamp,
      metrics: pattern,
      energyLevel:
        pattern.type === 'energy_time_of_day'
          ? this.calculateAverageEnergy(pattern.patterns)
          : null,
    }))

    // Store in database
    await db('pattern_statistics').insert(patternStats)
  }

  calculateSocialCircleImpact(participants, historicalEvents) {
    if (!participants || !historicalEvents.length) return 0

    const participantIds = new Set(participants.map((p) => p.id))
    const relevantEvents = historicalEvents.filter((event) =>
      event.participants.some((p) => participantIds.has(p.id))
    )

    if (!relevantEvents.length) return 0

    // Calculate average energy impact from historical events
    return (
      relevantEvents.reduce(
        (sum, event) => sum + (event.energyImpact || 0),
        0
      ) / relevantEvents.length
    )
  }

  calculateTimeOfDayImpact(date, historicalEvents, historicalCheckIns) {
    const hour = new Date(date).getHours()

    // Find historical events at similar time
    const similarTimeEvents = historicalEvents.filter((event) => {
      const eventHour = new Date(event.date).getHours()
      return Math.abs(eventHour - hour) <= 2
    })

    if (!similarTimeEvents.length) return 0

    // Calculate average energy impact
    return (
      similarTimeEvents.reduce(
        (sum, event) => sum + (event.energyImpact || 0),
        0
      ) / similarTimeEvents.length
    )
  }

  calculateDurationImpact(duration, historicalEvents) {
    if (!duration || !historicalEvents.length) return 0

    // Find events with similar duration
    const similarDurationEvents = historicalEvents.filter(
      (event) => Math.abs(event.duration - duration) <= 30 // 30 minutes threshold
    )

    if (!similarDurationEvents.length) return 0

    // Calculate average energy impact
    return (
      similarDurationEvents.reduce(
        (sum, event) => sum + (event.energyImpact || 0),
        0
      ) / similarDurationEvents.length
    )
  }

  determineRecoveryPeriod(energyImpact) {
    if (energyImpact <= this.recoveryPatterns.high_impact.threshold) {
      return this.recoveryPatterns.high_impact
    } else if (
      energyImpact <= this.recoveryPatterns.moderate_impact.threshold
    ) {
      return this.recoveryPatterns.moderate_impact
    }
    return null
  }

  calculateConfidenceScore(historicalEvents, historicalCheckIns) {
    // Base confidence on amount of historical data
    const eventWeight = 0.6
    const checkInWeight = 0.4

    const eventConfidence = Math.min(historicalEvents.length / 10, 1) // Max confidence at 10 events
    const checkInConfidence = Math.min(historicalCheckIns.length / 20, 1) // Max confidence at 20 check-ins

    return eventConfidence * eventWeight + checkInConfidence * checkInWeight
  }

  generateRecommendations(prediction) {
    const recommendations = []

    // Recovery recommendations
    if (prediction.recoveryPeriod) {
      recommendations.push({
        type: 'recovery',
        description: `Plan for ${prediction.recoveryPeriod.recommended_recovery} recovery period`,
        priority: prediction.recoveryPeriod.threshold <= -3 ? 'high' : 'medium',
      })
    }

    // Energy management recommendations
    if (prediction.energyImpact < -2) {
      recommendations.push({
        type: 'energy_management',
        description:
          'Consider scheduling this event when energy levels are typically higher',
        priority: 'medium',
      })
    }

    return recommendations
  }

  // Helper methods
  groupByDay(checkIns) {
    return checkIns.reduce((groups, checkIn) => {
      const date = new Date(checkIn.created_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(checkIn)
      return groups
    }, {})
  }

  groupBySocialCircle(events) {
    return events.reduce((groups, event) => {
      if (event.socialCircleId) {
        if (!groups[event.socialCircleId]) groups[event.socialCircleId] = []
        groups[event.socialCircleId].push(event)
      }
      return groups
    }, {})
  }

  calculateAverageImpact(events) {
    if (!events.length) return 0
    return (
      events.reduce((sum, event) => sum + (event.energyImpact || 0), 0) /
      events.length
    )
  }

  calculateMoodEnergyCorrelation(checkIns) {
    if (checkIns.length < 2) return 0

    const pairs = checkIns.map((checkIn) => ({
      mood: checkIn.mood,
      energy: checkIn.energyLevel,
    }))

    // Calculate correlation coefficient
    const n = pairs.length
    const sumMood = pairs.reduce((sum, pair) => sum + pair.mood, 0)
    const sumEnergy = pairs.reduce((sum, pair) => sum + pair.energy, 0)
    const sumMoodEnergy = pairs.reduce(
      (sum, pair) => sum + pair.mood * pair.energy,
      0
    )
    const sumMoodSquared = pairs.reduce(
      (sum, pair) => sum + pair.mood * pair.mood,
      0
    )
    const sumEnergySquared = pairs.reduce(
      (sum, pair) => sum + pair.energy * pair.energy,
      0
    )

    const numerator = n * sumMoodEnergy - sumMood * sumEnergy
    const denominator = Math.sqrt(
      (n * sumMoodSquared - sumMood * sumMood) *
        (n * sumEnergySquared - sumEnergy * sumEnergy)
    )

    return denominator === 0 ? 0 : numerator / denominator
  }

  calculateConfidence(sampleSize) {
    // Simple confidence calculation based on sample size
    // Returns value between 0 and 1
    const minSamples = 5
    const maxSamples = 50
    return Math.min(
      Math.max((sampleSize - minSamples) / (maxSamples - minSamples), 0),
      1
    )
  }

  calculateAverageEnergy(patterns) {
    if (!patterns || !patterns.length) return null
    return patterns.reduce((sum, p) => sum + p.energyLevel, 0) / patterns.length
  }
}

module.exports = PatternAnalyzer
