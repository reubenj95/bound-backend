/**
 * Migration: Add Energy Tracking System
 * This migration adds the core tables for the energy/burnout tracking system:
 * - checkins: Stores user energy levels and mood data
 * - impact_scores: Tracks impact of various entities on user energy
 * - keyword_categories: Hierarchical categorization of mood keywords
 */

exports.up = function (knex) {
  return (
    knex.schema
      // Checkins table for tracking user energy levels and moods
      .createTable('checkins', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now())
        table.integer('energy_level').notNullable()
        table.specificType('mood_keywords', 'TEXT[]')
        table.text('notes')
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())

        // Indexes for common queries
        table.index('timestamp')
        table.index('energy_level')
      })
      .then(() => {
        return knex.raw(`
        ALTER TABLE checkins 
        ADD CONSTRAINT energy_level_range 
        CHECK (energy_level >= -5 AND energy_level <= 1)
      `)
      })

      // Impact scores for various entities (events, people, etc.)
      .then(() => {
        return knex.schema.createTable('impact_scores', (table) => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
          table.text('entity_type').notNullable()
          table.uuid('entity_id').notNullable()
          // Separate foreign key columns for each entity type
          table
            .uuid('event_id')
            .references('id')
            .inTable('events')
            .onDelete('CASCADE')
          table
            .uuid('person_id')
            .references('id')
            .inTable('people')
            .onDelete('CASCADE')
          table
            .uuid('social_circle_id')
            .references('id')
            .inTable('social_circles')
            .onDelete('CASCADE')
          table.text('impact_type').notNullable()
          table.decimal('score', 4, 2).notNullable()
          table.decimal('confidence_factor', 3, 2).notNullable()
          table.timestamp('last_updated').notNullable().defaultTo(knex.fn.now())

          // Composite index for entity lookups
          table.index(['entity_type', 'entity_id'])
          table.index('impact_type')
        })
      })
      .then(() => {
        return knex.raw(`
        ALTER TABLE impact_scores 
        ADD CONSTRAINT confidence_factor_range 
        CHECK (confidence_factor >= 0 AND confidence_factor <= 1);

        ALTER TABLE impact_scores 
        ADD CONSTRAINT valid_entity_types 
        CHECK (entity_type IN ('event', 'person', 'social_circle'));

        -- Add trigger function to manage polymorphic relations
        CREATE OR REPLACE FUNCTION manage_impact_score_relations()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Clear all foreign key fields first
          NEW.event_id = NULL;
          NEW.person_id = NULL;
          NEW.social_circle_id = NULL;
          
          -- Set the appropriate foreign key based on entity_type
          CASE NEW.entity_type
            WHEN 'event' THEN
              NEW.event_id = NEW.entity_id;
            WHEN 'person' THEN
              NEW.person_id = NEW.entity_id;
            WHEN 'social_circle' THEN
              NEW.social_circle_id = NEW.entity_id;
          END CASE;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger
        CREATE TRIGGER impact_score_relations_trigger
        BEFORE INSERT OR UPDATE ON impact_scores
        FOR EACH ROW
        EXECUTE FUNCTION manage_impact_score_relations();
      `)
      })

      // Keyword categories for mood analysis
      .then(() => {
        return knex.schema.createTable('keyword_categories', (table) => {
          table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
          table.text('name').notNullable().unique()
          table
            .uuid('parent_id')
            .references('id')
            .inTable('keyword_categories')
            .onDelete('SET NULL')
          table.decimal('impact_weight', 3, 2).notNullable()

          // Index for hierarchical queries
          table.index('parent_id')
        })
      })
      .then(() => {
        return knex.raw(`
        ALTER TABLE keyword_categories 
        ADD CONSTRAINT impact_weight_range 
        CHECK (impact_weight >= 0 AND impact_weight <= 1)
      `)
      })
  )
}

exports.down = function (knex) {
  return (
    knex.schema
      // Drop trigger and function first
      .raw(
        `
      DROP TRIGGER IF EXISTS impact_score_relations_trigger ON impact_scores;
      DROP FUNCTION IF EXISTS manage_impact_score_relations;
    `
      )
      // Drop tables in reverse order to handle dependencies
      .then(() => {
        return knex.schema
          .dropTableIfExists('keyword_categories')
          .dropTableIfExists('impact_scores')
          .dropTableIfExists('checkins')
      })
  )
}
