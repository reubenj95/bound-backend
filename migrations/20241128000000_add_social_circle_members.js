/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('social_circle_members')
  if (!exists) {
    return knex.schema.createTable('social_circle_members', (table) => {
      table
        .uuid('social_circle_id')
        .references('id')
        .inTable('social_circles')
        .onDelete('CASCADE')
      table
        .uuid('person_id')
        .references('id')
        .inTable('people')
        .onDelete('CASCADE')
      table.primary(['social_circle_id', 'person_id'])
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('social_circle_members')
}
