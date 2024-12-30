/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return (
    knex.schema
      // Users table
      .createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('username', 255).notNullable().unique()
        table.string('email', 255).notNullable().unique()
        table.string('password_hash', 255).notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
      })

      // Event Categories table
      .createTable('event_categories', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name', 255).notNullable()
        table.string('color', 7)
        table.string('icon', 255)
        table.integer('energy_impact').checkBetween([-5, 5]) // Added energy_impact column
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
      })

      // Social Circles table
      .createTable('social_circles', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name', 255).notNullable()
        table.text('description')
        table.string('color', 7)
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
      })

      // Events table
      .createTable('events', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('title', 255).notNullable()
        table.text('description')
        table.timestamp('start_date').notNullable()
        table.timestamp('end_date')
        table.string('location', 255)
        table.uuid('category_id').references('id').inTable('event_categories')
        table.uuid('user_id').references('id').inTable('users')
        table.integer('energy_level').checkBetween([1, 10])
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())

        // Indexes
        table.index('category_id')
        table.index('user_id')
        table.index('start_date')
      })

      // People table
      .createTable('people', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name', 255).notNullable()
        table.string('email', 255)
        table.string('phone', 50)
        table
          .uuid('social_circle_id')
          .references('id')
          .inTable('social_circles')
        table.text('notes')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())

        // Indexes
        table.index('social_circle_id')
        table.index('name')
      })

      // Check-ins table
      .createTable('check_ins', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid('user_id').references('id').inTable('users').notNullable()
        table.uuid('event_id').references('id').inTable('events')
        table.enu('check_in_type', ['pre_event', 'post_event', 'general'])
        table.integer('energy_rating').checkBetween([1, 10])
        table.text('notes')
        table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now())
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())

        // Indexes
        table.index('user_id')
        table.index('event_id')
        table.index('timestamp')
        table.index('check_in_type')
      })

      // Feelings table
      .createTable('feelings', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('word', 100).notNullable().unique()
        table.string('category', 50)
        table.timestamp('created_at').defaultTo(knex.fn.now())

        // Indexes
        table.index('category')
      })

      // Check-in Feelings table (junction table)
      .createTable('check_in_feelings', (table) => {
        table.uuid('check_in_id').references('id').inTable('check_ins')
        table.uuid('feeling_id').references('id').inTable('feelings')
        table.integer('intensity').checkBetween([1, 5])
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.primary(['check_in_id', 'feeling_id'])

        // Indexes
        table.index('feeling_id')
      })

      // Articles table
      .createTable('articles', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('title', 255).notNullable()
        table.text('content').notNullable()
        table.uuid('author_id').references('id').inTable('users')
        table.string('image_url', 255)
        table.timestamp('published_at')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())

        // Indexes
        table.index('author_id')
        table.index('published_at')
      })

      // Event Participants table (junction table)
      .createTable('event_participants', (table) => {
        table.uuid('event_id').references('id').inTable('events')
        table.uuid('person_id').references('id').inTable('people')
        table.enu('status', ['attending', 'declined', 'maybe', 'invited'])
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.primary(['event_id', 'person_id'])

        // Indexes
        table.index('person_id')
      })
  )
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('event_participants')
    .dropTableIfExists('articles')
    .dropTableIfExists('check_in_feelings')
    .dropTableIfExists('feelings')
    .dropTableIfExists('check_ins')
    .dropTableIfExists('people')
    .dropTableIfExists('events')
    .dropTableIfExists('social_circles')
    .dropTableIfExists('event_categories')
    .dropTableIfExists('users')
}
