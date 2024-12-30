const db = require('../db')
const { formatResponse } = require('../utils/responseFormatter')
const PatternAnalyzer = require('../services/PatternAnalyzer')
const InsightGenerator = require('../services/InsightGenerator')
const RecommendationEngine = require('../services/RecommendationEngine')

class AnalysisController {
  constructor() {
    this.patternAnalyzer = new PatternAnalyzer()
    this.insightGenerator = new InsightGenerator()
    this.recommendationEngine = new RecommendationEngine()
  }

  // Pattern Analysis
  async analyzePatterns(req, res) {
    try {
      const {
        userId,
        startDate,
        endDate,
        eventTypes,
        metrics = ['energy', 'mood', 'social_interaction'],
      } = req.query

      // Validate date range
      const validatedStartDate = new Date(
        startDate || new Date().setDate(new Date().getDate() - 30)
      )
      const validatedEndDate = new Date(endDate || new Date())

      // Fetch relevant data
      const checkIns = await db('check_ins')
        .where('user_id', userId)
        .whereBetween('created_at', [validatedStartDate, validatedEndDate])
        .orderBy('created_at', 'asc')

      const events = await db('events')
        .where('user_id', userId)
        .whereBetween('date', [validatedStartDate, validatedEndDate])
        .orderBy('date', 'asc')

      // Analyze patterns
      const patterns = await this.patternAnalyzer.analyze({
        checkIns,
        events,
        metrics,
        eventTypes,
      })

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

  // Impact Predictions
  async predictImpact(req, res) {
    try {
      const { eventType, userId, date, duration, participants } = req.body

      // Get historical data for better predictions
      const historicalEvents = await db('events')
        .where({
          user_id: userId,
          event_type: eventType,
        })
        .orderBy('date', 'desc')
        .limit(10)

      const historicalCheckIns = await db('check_ins')
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(20)

      // Generate prediction
      const prediction = await this.patternAnalyzer.predictImpact({
        eventType,
        date,
        duration,
        participants,
        historicalEvents,
        historicalCheckIns,
      })

      return formatResponse(res, 200, {
        success: true,
        data: prediction,
      })
    } catch (error) {
      return formatResponse(res, 500, {
        success: false,
        error: error.message,
      })
    }
  }

  // Insight Retrieval
  async getInsights(req, res) {
    try {
      const {
        userId,
        timeframe = '30d',
        categories = ['energy', 'social', 'activities'],
      } = req.query

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const days = parseInt(timeframe)
      startDate.setDate(startDate.getDate() - days)

      // Fetch relevant data
      const [checkIns, events, socialCircles] = await Promise.all([
        db('check_ins')
          .where('user_id', userId)
          .whereBetween('created_at', [startDate, endDate]),
        db('events')
          .where('user_id', userId)
          .whereBetween('date', [startDate, endDate]),
        db('social_circles').where('user_id', userId),
      ])

      // Generate insights
      const insights = await this.insightGenerator.generate({
        checkIns,
        events,
        socialCircles,
        categories,
        timeframe: days,
      })

      return formatResponse(res, 200, {
        success: true,
        data: insights,
      })
    } catch (error) {
      return formatResponse(res, 500, {
        success: false,
        error: error.message,
      })
    }
  }

  // Report Generation
  async generateReport(req, res) {
    try {
      const {
        userId,
        startDate,
        endDate,
        format = 'json',
        sections = ['patterns', 'insights', 'recommendations'],
      } = req.body

      // Validate dates
      const validatedStartDate = new Date(startDate)
      const validatedEndDate = new Date(endDate)

      // Gather all necessary data
      const [checkIns, events, socialCircles] = await Promise.all([
        db('check_ins')
          .where('user_id', userId)
          .whereBetween('created_at', [validatedStartDate, validatedEndDate]),
        db('events')
          .where('user_id', userId)
          .whereBetween('date', [validatedStartDate, validatedEndDate]),
        db('social_circles').where('user_id', userId),
      ])

      // Generate report sections
      const reportData = {}

      if (sections.includes('patterns')) {
        reportData.patterns = await this.patternAnalyzer.analyze({
          checkIns,
          events,
          metrics: ['energy', 'mood', 'social_interaction'],
        })
      }

      if (sections.includes('insights')) {
        reportData.insights = await this.insightGenerator.generate({
          checkIns,
          events,
          socialCircles,
          categories: ['energy', 'social', 'activities'],
          timeframe: Math.ceil(
            (validatedEndDate - validatedStartDate) / (1000 * 60 * 60 * 24)
          ),
        })
      }

      if (sections.includes('recommendations')) {
        reportData.recommendations =
          await this.recommendationEngine.generateRecommendations({
            patterns: reportData.patterns,
            insights: reportData.insights,
            userId,
          })
      }

      // Format report based on requested format
      let formattedReport
      switch (format.toLowerCase()) {
        case 'pdf':
          formattedReport = await this.generatePDFReport(reportData)
          res.header('Content-Type', 'application/pdf')
          res.attachment('analysis-report.pdf')
          break
        case 'csv':
          formattedReport = this.generateCSVReport(reportData)
          res.header('Content-Type', 'text/csv')
          res.attachment('analysis-report.csv')
          break
        case 'json':
        default:
          formattedReport = JSON.stringify(reportData, null, 2)
          res.header('Content-Type', 'application/json')
          res.attachment('analysis-report.json')
          break
      }

      return res.send(formattedReport)
    } catch (error) {
      return formatResponse(res, 500, {
        success: false,
        error: error.message,
      })
    }
  }

  // Helper methods
  async generatePDFReport(data) {
    // Implementation would depend on PDF generation library
    // This is a placeholder for the actual implementation
    throw new Error('PDF generation not implemented')
  }

  generateCSVReport(data) {
    const rows = []

    // Add patterns
    if (data.patterns) {
      rows.push(['Patterns'])
      rows.push(['Metric', 'Value', 'Confidence'])
      data.patterns.forEach((pattern) => {
        rows.push([pattern.metric, pattern.value, pattern.confidence])
      })
      rows.push([]) // Empty row for separation
    }

    // Add insights
    if (data.insights) {
      rows.push(['Insights'])
      rows.push(['Category', 'Description', 'Impact'])
      data.insights.forEach((insight) => {
        rows.push([insight.category, insight.description, insight.impact])
      })
      rows.push([])
    }

    // Add recommendations
    if (data.recommendations) {
      rows.push(['Recommendations'])
      rows.push(['Type', 'Description', 'Priority'])
      data.recommendations.forEach((rec) => {
        rows.push([rec.type, rec.description, rec.priority])
      })
    }

    return rows.map((row) => row.join(',')).join('\n')
  }
}

module.exports = new AnalysisController()
