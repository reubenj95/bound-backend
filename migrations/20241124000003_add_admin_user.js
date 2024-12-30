const bcrypt = require('bcrypt')

exports.up = async function (knex) {
  const saltRounds = 10
  const passwordHash = await bcrypt.hash('Hello123!!', saltRounds)

  return knex('users').insert({
    username: 'admin',
    email: 'admin@bound.com',
    password_hash: passwordHash,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  })
}

exports.down = function (knex) {
  return knex('users').where('username', 'admin').del()
}
