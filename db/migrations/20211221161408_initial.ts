import { Knex } from "knex"

export const up = (knex: Knex): Promise<void> => knex.schema

// User
  .createTable('usr', table => {
    table.string('phone_number').notNullable().primary()

    table.string('image_url')
    table.string('bio').defaultTo('').notNullable()

    table.datetime('otp_valid_from')
    table.datetime('otp_last_attempt')

    // table.string('blocklist') 
    // Server maintains an encrypted list of blocked users.
    // How to update?
    // Get list from db. add new user. send to db along with old list. Only update if old list matches. Otherwise, return the latest from the db.
    // If this becomes corrupt, restore based on local list.
  })

// Auth
  .createView('view_auth', view => {
    view.columns(['phone_number', 'has_valid_otp', 'queried_this_second'])
    view.as(knex('usr').select(['phone_number',
      knex.raw(`now() < otp_valid_from + INTERVAL '30 seconds' is true`),
      knex.raw(`now() > otp_last_attempt + INTERVAL '1 second' is true`)
    ]))
  })

// Session
  .raw(`
    CREATE TABLE session (
      id      UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id STRING(13) NOT NULL REFERENCES usr(phone_number)
    )
  `)

// Ciphertext
  .raw(`
    CREATE TABLE ciphertext (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    )
  `)
  .alterTable('ciphertext', table => {
    table.string('body').notNullable()
    table.datetime('datetime').notNullable()

    table.string('sender').references('usr.phone_number').notNullable()
    table.string('recipient').references('usr.phone_number').notNullable()
  })

  // Profile Picture updates
  .raw(`
    CREATE TABLE profile_picture_update (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid()
      image_base64 STRING(255) NOT NULL
    )
  `)


export const down = (knex: Knex): Promise<void> => knex.schema
  .dropTable('message')
  .dropTable('chat')
  .dropTable('session')
  .dropView('view_auth')
  .dropTable('usr')

