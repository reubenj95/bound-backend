/**
 * Migration: Fix Energy Level Range
 * Updates the energy_level_range constraint in the checkins table
 * to use the correct range of -5 to 5
 */

exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE checkins 
    DROP CONSTRAINT energy_level_range;

    ALTER TABLE checkins 
    ADD CONSTRAINT energy_level_range 
    CHECK (energy_level >= -5 AND energy_level <= 5);
  `)
}

exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE checkins 
    DROP CONSTRAINT energy_level_range;

    ALTER TABLE checkins 
    ADD CONSTRAINT energy_level_range 
    CHECK (energy_level >= -5 AND energy_level <= 1);
  `)
}
