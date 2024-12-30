/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    // First check if we need to transform the data
    const result = await trx.raw(`
      SELECT MAX(energy_level) as max_energy
      FROM events
      WHERE energy_level IS NOT NULL
    `)

    const maxEnergy = result.rows[0].max_energy

    // Drop any existing check constraints
    await trx.raw(`
      ALTER TABLE events
      DROP CONSTRAINT IF EXISTS events_energy_level_1,
      DROP CONSTRAINT IF EXISTS events_energy_level_new_range
    `)

    // Only transform if data is in the old range [1,10]
    if (maxEnergy > 5) {
      // Transform existing energy levels from [1,10] to [-5,5]
      await trx.raw(`
        UPDATE events 
        SET energy_level = ROUND(
          (((energy_level - 1) * 10.0) / 9.0) - 5
        )
        WHERE energy_level IS NOT NULL
      `)
    }

    // Add the new constraint with a unique name
    await trx.raw(`
      ALTER TABLE events
      ADD CONSTRAINT events_energy_level_new_range
      CHECK (energy_level BETWEEN -5 AND 5)
    `)
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    // First check if we need to transform the data
    const result = await trx.raw(`
      SELECT MIN(energy_level) as min_energy
      FROM events
      WHERE energy_level IS NOT NULL
    `)

    const minEnergy = result.rows[0].min_energy

    // Drop any existing check constraints
    await trx.raw(`
      ALTER TABLE events
      DROP CONSTRAINT IF EXISTS events_energy_level_1,
      DROP CONSTRAINT IF EXISTS events_energy_level_new_range
    `)

    // Only transform if data is in the new range [-5,5]
    if (minEnergy < 1) {
      // Transform the data back from [-5,5] to [1,10]
      await trx.raw(`
        UPDATE events 
        SET energy_level = ROUND(
          (((energy_level + 5) * 9.0) / 10.0) + 1
        )
        WHERE energy_level IS NOT NULL
      `)
    }

    // Add back the original constraint with its original name
    await trx.raw(`
      ALTER TABLE events
      ADD CONSTRAINT events_energy_level_1
      CHECK (energy_level BETWEEN 1 AND 10)
    `)
  })
}
