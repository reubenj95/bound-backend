/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('notification_templates', (table) => {
      table.string('id').primary()
      table.string('type').notNullable()
      table.string('timing').notNullable()
      table.text('template').notNullable()
      table.json('actions')
      table.boolean('include_energy_scale').defaultTo(false)
      table.boolean('include_keywords').defaultTo(false)
      table.timestamps(true, true)
    })
    .createTable('notification_preferences', (table) => {
      table.string('userId').primary()
      table.json('channels').notNullable()
      table.json('quietHours').notNullable()
      table.string('timezone').notNullable().defaultTo('UTC')
      table.enum('frequency', ['low', 'medium', 'high']).defaultTo('medium')
      table.timestamps(true, true)
    })
    .createTable('notifications', (table) => {
      table.uuid('id').primary()
      table.string('userId').notNullable()
      table.string('templateId').notNullable()
      table.text('content').notNullable()
      table
        .enum('status', ['pending', 'sent', 'failed', 'delivered'])
        .defaultTo('pending')
      table.timestamp('scheduledFor').notNullable()
      table.timestamp('sentAt')
      table.timestamp('deliveredAt')
      table.enum('channel', ['push', 'email', 'in_app']).notNullable()
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('low')
      table.json('context')
      table.json('actions')
      table.integer('retryCount').defaultTo(0)
      table.text('error')
      table.timestamps(true, true)

      table.index(['userId', 'status', 'scheduledFor'])
      table.index(['status', 'scheduledFor'])
    })
    .then(() => {
      // Insert default notification templates
      return knex('notification_templates').insert([
        {
          id: 'pre_event',
          type: 'energy_management',
          timing: '24_hours_before',
          template:
            'You have {event_type} with {social_circle} tomorrow. Based on your patterns, these events often impact your energy levels. Would you like to block out some recovery time?',
          actions: JSON.stringify([
            'block_recovery_time',
            'schedule_light_activities',
          ]),
          include_energy_scale: false,
          include_keywords: false,
        },
        {
          id: 'post_event',
          type: 'check_in',
          timing: '2_hours_after',
          template: 'How are you feeling after {event_type}?',
          actions: JSON.stringify([]),
          include_energy_scale: true,
          include_keywords: true,
        },
      ])
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('notification_preferences')
    .dropTableIfExists('notification_templates')
}
