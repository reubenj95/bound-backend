/**
 * Migration to add pattern analysis system tables
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('pattern_statistics', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('userId').notNullable()
      table.uuid('checkInId').notNullable()
      table.integer('energyLevel').notNullable()
      table.timestamp('timestamp').notNullable()
      table.jsonb('metrics').notNullable().defaultTo('{}')
      table.foreign('userId').references('users.id')
      table.foreign('checkInId').references('check_ins.id')
      table.unique(['checkInId'])
      table.index(['userId', 'timestamp'])
    })
    .createTable('recovery_periods', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('userId').notNullable()
      table.uuid('startCheckInId').notNullable()
      table.uuid('endCheckInId').notNullable()
      table.integer('duration').notNullable() // in milliseconds
      table.timestamp('timestamp').notNullable()
      table.foreign('userId').references('users.id')
      table.foreign('startCheckInId').references('check_ins.id')
      table.foreign('endCheckInId').references('check_ins.id')
      table.index(['userId', 'timestamp'])
    })
    .createTable('generated_insights', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('userId').notNullable()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.integer('priority').notNullable()
      table.jsonb('recommendations').notNullable()
      table.jsonb('context').notNullable()
      table.float('confidence').notNullable()
      table.string('category').notNullable()
      table.timestamp('timestamp').notNullable()
      table.foreign('userId').references('users.id')
      table.index(['userId', 'timestamp'])
    })
    .createTable('recommendations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('userId').notNullable()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.jsonb('actionItems').notNullable()
      table.integer('priority').notNullable()
      table.float('predictedImpact').notNullable()
      table.float('confidence').notNullable()
      table.jsonb('context').notNullable()
      table.string('status').notNullable()
      table.timestamp('createdAt').notNullable()
      table.timestamp('expiresAt')
      table.jsonb('metadata').notNullable()
      table.foreign('userId').references('users.id')
      table.index(['userId', 'status'])
      table.index(['userId', 'createdAt'])
    })
    .createTable('recommendation_feedback', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('recommendationId').notNullable()
      table.uuid('userId').notNullable()
      table.boolean('helpful').notNullable()
      table.boolean('implemented').notNullable()
      table.float('actualImpact').notNullable()
      table.text('comments')
      table.timestamp('timestamp').notNullable()
      table.foreign('recommendationId').references('recommendations.id')
      table.foreign('userId').references('users.id')
      table.index(['recommendationId'])
      table.index(['userId', 'timestamp'])
    })
    .createTable('ab_test_variants', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'))
      table.uuid('recommendationId').notNullable()
      table.string('variant').notNullable()
      table.jsonb('metrics').notNullable()
      table.foreign('recommendationId').references('recommendations.id')
      table.index(['recommendationId'])
    })
}

/**
 * Rollback migration
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('ab_test_variants')
    .dropTableIfExists('recommendation_feedback')
    .dropTableIfExists('recommendations')
    .dropTableIfExists('generated_insights')
    .dropTableIfExists('recovery_periods')
    .dropTableIfExists('pattern_statistics')
}
