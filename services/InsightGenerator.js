class InsightGenerator {
  constructor() {
    this.categories = {
      energy: this.analyzeEnergyInsights.bind(this),
      social: this.analyzeSocialInsights.bind(this),
      activities: this.analyzeActivityInsights.bind(this),
    }
  }

  async generate(data) {
    try {
      // Validate input
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid input: data must be an object')
      }

      const {
        checkIns = [],
        events = [],
        socialCircles = [],
        categories = [],
        timeframe,
      } = data

      // Validate arrays
      if (
        !Array.isArray(checkIns) ||
        !Array.isArray(events) ||
        !Array.isArray(socialCircles) ||
        !Array.isArray(categories)
      ) {
        throw new Error(
          'Invalid input: checkIns, events, socialCircles, and categories must be arrays'
        )
      }

      const insights = []

      // Process each requested category
      for (const category of categories) {
        if (this.categories[category]) {
          const categoryInsights = await this.categories[category](
            checkIns,
            events,
            socialCircles,
            timeframe
          )
          insights.push(...categoryInsights)
        }
      }

      // Sort insights by priority and confidence
      return this.prioritizeInsights(insights)
    } catch (error) {
      console.error('Error generating insights:', error)
      throw new Error('Failed to generate insights')
    }
  }

  async analyzeEnergyInsights(checkIns, events, socialCircles, timeframe) {
    const insights = []

    // Analyze energy level patterns
    if (checkIns && checkIns.length > 0) {
      const energyLevels = checkIns.map((c) => c.energy_level)
      const avgEnergy =
        energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length

      // High energy variance insight
      const energyVariance = this.calculateVariance(energyLevels)
      if (energyVariance > 2) {
        insights.push({
          id: `energy_variance_${Date.now()}`,
          title: 'Energy Level Fluctuation Detected',
          description: 'Your energy levels show significant variation',
          priority: 1,
          recommendations: [
            'Consider maintaining a more consistent daily routine',
            'Track activities that might be causing energy spikes or drops',
            'Focus on stabilizing sleep patterns',
          ],
          confidence: 0.8,
          category: 'energy',
          timestamp: new Date(),
        })
      }

      // Low energy trend insight
      if (avgEnergy < 3) {
        insights.push({
          id: `low_energy_${Date.now()}`,
          title: 'Low Energy Pattern Detected',
          description: 'Your average energy levels are lower than optimal',
          priority: 1,
          recommendations: [
            'Schedule more recovery time between activities',
            'Review your sleep habits',
            'Consider reducing high-impact activities temporarily',
          ],
          confidence: 0.85,
          category: 'energy',
          timestamp: new Date(),
        })
      }
    }

    return insights
  }

  async analyzeSocialInsights(checkIns, events, socialCircles, timeframe) {
    const insights = []

    // Analyze social interaction patterns
    if (
      events &&
      events.length > 0 &&
      socialCircles &&
      socialCircles.length > 0
    ) {
      const socialEvents = events.filter(
        (e) => e.participants && e.participants.length > 0
      )
      const socialRatio = socialEvents.length / events.length

      // Social isolation insight
      if (socialRatio < 0.2 && events.length > 5) {
        insights.push({
          id: `social_isolation_${Date.now()}`,
          title: 'Limited Social Interaction Detected',
          description: 'Your social engagement has been lower than usual',
          priority: 2,
          recommendations: [
            'Consider scheduling more group activities',
            'Reach out to friends or family members',
            'Join social events within your comfort zone',
          ],
          confidence: 0.75,
          category: 'social',
          timestamp: new Date(),
        })
      }

      // Social circle diversity insight
      const activeCircles = new Set(
        socialEvents.flatMap((e) =>
          e.participants.map((p) => p.social_circle_id)
        )
      ).size

      if (activeCircles < socialCircles.length / 2) {
        insights.push({
          id: `social_diversity_${Date.now()}`,
          title: 'Social Circle Engagement Opportunity',
          description: 'Some of your social circles have been less active',
          priority: 3,
          recommendations: [
            'Consider reconnecting with less active social circles',
            'Plan activities that involve different groups',
            'Balance time across your social networks',
          ],
          confidence: 0.7,
          category: 'social',
          timestamp: new Date(),
        })
      }
    }

    return insights
  }

  async analyzeActivityInsights(checkIns, events, socialCircles, timeframe) {
    const insights = []

    if (events && events.length > 0) {
      // Analyze activity patterns
      const eventTypes = events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {})

      // Activity balance insight
      const eventTypeCount = Object.keys(eventTypes).length
      if (eventTypeCount < 3 && events.length > 5) {
        insights.push({
          id: `activity_variety_${Date.now()}`,
          title: 'Limited Activity Variety Detected',
          description: 'Your activities have been less diverse than optimal',
          priority: 2,
          recommendations: [
            'Try incorporating new types of activities',
            'Balance different categories of events',
            'Explore activities that align with your interests',
          ],
          confidence: 0.8,
          category: 'activities',
          timestamp: new Date(),
        })
      }

      // Activity intensity distribution
      const highIntensityCount = events.filter(
        (e) => e.intensity === 'high'
      ).length
      const totalEvents = events.length
      if (highIntensityCount / totalEvents > 0.7) {
        insights.push({
          id: `high_intensity_${Date.now()}`,
          title: 'High Intensity Activity Pattern',
          description:
            'Your schedule shows a high proportion of intense activities',
          priority: 2,
          recommendations: [
            'Consider incorporating more low-intensity activities',
            'Balance high-intensity activities with recovery periods',
            'Monitor energy levels during intense periods',
          ],
          confidence: 0.85,
          category: 'activities',
          timestamp: new Date(),
        })
      }
    }

    return insights
  }

  prioritizeInsights(insights) {
    return insights.sort((a, b) => {
      // Primary sort by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // Secondary sort by confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence
      }
      // Tertiary sort by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    const squareDiffs = numbers.map((value) => {
      const diff = value - mean
      return diff * diff
    })
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numbers.length)
  }
}

module.exports = InsightGenerator
