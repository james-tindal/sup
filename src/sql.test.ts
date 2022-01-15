import * as db from '#/services/db'
import { knex, raw } from '#/utilities/knex'


// cockroach start-single-node --advertise-addr 'localhost' --insecure
// postgresql://root@localhost:26257/defaultdb?sslmode=disable

/*
describe('db.request_new_otp', () => {
// MUTATE Create user if not found
// IF   otp_valid_from within 30 seconds (has_valid_otp)
// THEN RETURN null
// ELSE MUTATE otp_valid_from = now()
//      RETURN otp_valid_from
  const phone_number = '+441632960734'
  const timestamp_regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{6}\+\d{2}$/

  // Cases:
  // User not found:
    // create user, set otp_valid from = now()
    // return otp_valid_from
  // otp_valid_from not within 30 seconds
    // set otp_valid from = now()
    // return otp_valid_from
  // otp_valid_from within 30 seconds:
    // return null

  test('User not found', async () => {
    await knex.migrate.latest()

    // Return otp_valid_from, a timestamp
    const response_1 = await db.request_new_otp(phone_number)
    expect(response_1).toMatch(timestamp_regex)

    // Returned timestamp matches otp_valid_from in the database
    const response_2 = await knex('usr').where({ phone_number, otp_valid_from: response_1 })
    expect(response_2.length).toEqual(1)
    
  })

  test('NOT otp_valid_from within 30 seconds', async () => {
    await knex('usr').truncate()

    const time_1 = '2021-12-27 21:52:26.078832+00'
    const time_2 = '2022-12-27 21:52:55.078832+00'  // 29 seconds later

    knex.raw(sql`
      BEGIN AS OF SYSTEM TIME '${time_1}';
      UPSERT INTO (phone_number, otp_valid_from) VALUES ('${phone_number}', now());
    `)

    // Add a user with otp_valid_from
    knex('usr').insert({ phone_number, otp_valid_from: time_1 })
    // Query 29 seconds later

    // Return otp_valid_from, a timestamp
    const response_1 = await db.request_new_otp(phone_number)
    expect(response_1).toMatch(timestamp_regex)

    // Returned timestamp matches otp_valid_from in the database
    const response_2 = await knex('usr').where({ phone_number, otp_valid_from: response_1 })
    expect(response_2.length).toEqual(1)
    
  })


  test('otp_valid_from within 30 seconds', async () => {
    await knex('usr').truncate()

    // Return null
    const response = await db.request_new_otp(phone_number)
    expect(response).toEqual(null)
  })
  // Does a user ever have otp_valid_from null?
  // Yes. When the correct the login process is completed by a correct otp attempt,
  // otp_valid_from is set to null.
})
*/

// describe.only('db.request_new_otp', () => {
//   test('', async () => {
//     await knex.migrate.rollback()
//     await knex.migrate.latest()

//     const phone_number = '+441632960734'
//     await db.request_new_otp(phone_number)
//     const x = await db.invalidate_otp__create_session(phone_number)
//     throw x
//   })
// })