import 'jest-extended'
import request from "supertest"

import responses from '#/utilities/api-responses'
import { SESSION_HASH_BASE64_LENGTH } from "#/modules/auth"

import { App } from '#/core/app'
const app = App()

jest.mock('#/services/db')
import * as _db from '#/services/db'
const db = jest.mocked(_db, true)

jest.mock('#/services/sms')
import * as _sms from '#/services/sms'
const sms = jest.mocked(_sms, true)

jest.mock('#/services/push')
import * as _push from '#/services/push'
import { Push } from './modules/message'
const push = jest.mocked(_push, true)


describe('auth.request: Request a new OTP', () => {
  const ApiResponse = responses['auth.request']
  const phone_number = '+441632960734'

  ~~~`
  OTP: One-time password

  CockroachDB will send a new timestamp at most once every 30 seconds.

  The job of this Node server is to:
  ✅ query the DB
  ✅ hash the OTP timestamp
  ✅ send the SMS
  ✅ respond to the client

  An OTP remains valid for 30 seconds.
  Until then, a new OTP will not be created, nor a new SMS sent.
  ~~~`

  ~~~`
  What it needs 2 do:

  1. Query the DB for the current timestamp.
  2. If the timestamp is null, create a new timestamp.

  3. Hash the timestamp.
  4. Send the SMS.
  5. Respond to the client.

  6. The timestamp is valid for 30 seconds.
  7. Until then, a new OTP will not be created, nor a new SMS sent.



  ~~~`

  /*
        2 cases:
        DB returns timestamp:
          Hash it. SMS it. Signal success.
        DB returns null.
          Signal failure.
  */

  test('DB created a new OTP timestamp. Hash it and send via SMS.', async () => {
    db.request_new_otp.mockResolvedValueOnce('2021-12-24 23:27:53.722514+00')

    const received = await request(app)
      .post("/trpc/auth.request")
      .send({ phone_number })

    expect(received.statusCode)
      .toBe(200)
    expect(received.body)
      .toStrictEqual(ApiResponse.sent_sms_otp().body)

    expect(sms.send_sms)
      .toHaveBeenCalledOnce()

    expect(sms.send_sms.mock.calls)
      .toMatchObject([[ phone_number, expect.stringMatching(/^Here is your one-time password to sign in to Sup: \d{6}$/) ]])
  })

  test('When requested again within 30 seconds, reject', async() => {
    db.request_new_otp.mockResolvedValueOnce(null)

    const received = await request(app)
      .post("/trpc/auth.request")
      .send({ phone_number })
    
    expect(received.statusCode)
      .toBe(200)
    expect(received.body)
      .toStrictEqual(ApiResponse.only_once_per_30s().body)

    expect(sms.send_sms)
      .toHaveBeenCalledTimes(0)

  }) 
})

describe('auth.complete: Attempt to submit the correct OTP', () => {
  const ApiResponse = responses['auth.complete']
  const phone_number = '+441632960734'
  const otp_valid_from = '2021-12-24 23:27:53.722514+00'

  ~~~`
  When the phone_number matches the otp_attempt:
    Invalidate OTP (Set otp_valid_from to null)
    Create a session
  Else:
    Set otp_last_attempt to now()
  Respond to client

  ~~~`

  const get_otp = async () => {
    db.request_new_otp.mockResolvedValue(otp_valid_from)

    await request(app)
      .post("/trpc/auth.request")
      .send({ phone_number })
    
    const otp = sms.send_sms.mock.calls[0][1].match(/\d{6}$/)[0]
    return otp
  }

  test('Wrong OTP submitted. Respond with "Failure"', async () => {
    await get_otp()

    db.get_timestamp_if_valid.mockResolvedValue(otp_valid_from)

    const received = await request(app)
      .post("/trpc/auth.complete")
      .send({ phone_number, otp_attempt: '000000' })
    
    expect(received.statusCode)
      .toBe(200)
    expect(received.body)
      .toStrictEqual(ApiResponse.failure().body)
  })

  test('Correct OTP submitted. Respond with "Success" and a session.', async () => {
    const otp = await get_otp()
    const session_id = '49cf73ca3abc4217a8d048de51a37257'
    
    db.get_timestamp_if_valid.mockResolvedValueOnce(otp_valid_from)
    db.invalidate_otp__create_session.mockResolvedValueOnce(session_id)

    const received = await request(app)
      .post("/trpc/auth.complete")
      .send({ phone_number, otp_attempt: otp })

    expect(db.get_timestamp_if_valid)
      .toHaveBeenCalledOnce()
    expect(db.invalidate_otp__create_session)
      .toHaveBeenCalledOnce()
    expect(received.statusCode)
      .toBe(200)
    expect(received.body)
      .toEqual(ApiResponse.success(session_id).body)

    expect(received.header['set-cookie'])
      .toEqual([expect.stringMatching(RegExp(`^session=${session_id}.{${SESSION_HASH_BASE64_LENGTH}};`))])
    
  })

})

describe('message.send', () => {
  const ApiResponse = responses['message.send']
  const sender_phone_number = '+441632960734'
  const recipient_phone_number = '+449371056732'
  const ciphertext = '397g1fh84f1x3y982soa'
  const session_id = '49cf73ca3abc4217a8d048de51a37257'
  const session_hash = 'kvFYYw1pUnibBNZiszp5czn5bTUr%2Flu2LtS6LPoYyKA%3D'

  // Client sends a message to the server.
  // Server stores the message until the recipient picks it up.
  // The messages are stored in the recipients' inboxes.
  // The client needs to comply with requests to delete messages.
  // But how is the message identified? A timestamp.
  // Ensure all clients agree on the timestamp.
  // Ensure messages cannot be sent too frequently or at the same time.
  // But what if messages are recieved from multiple clients?

  ~~~`
  Cases:

  1. No session cookie
  2. Invalid session hash
  3. Invalid session id
  4. Ciphertext too long

  Later, distinguish between reasons for session validation failure and log it.

  5. Unknown recipient
  6. If the session is current, the recipient has an accouunt, and the ciphertext is not too long: push the ciphertext
  ~~~`


  test('No session cookie', async () => {
    const received = await request(app)
      .post("/trpc/message.send")
      .send({ ciphertext, recipient_phone_number })

    expect(received.statusCode)
      .toBe(401)
    expect(received.body)
      .toEqual(responses.auth.not_authenticated().body)
  })

  test('Invalid session hash', async () => {
    const received = await request(app)
      .post("/trpc/message.send")
      .set({ Cookie: `session=${session_id}invalid_hash;` })
      .send({ ciphertext, recipient_phone_number })

    expect(db.get_sender_recipient)
      .toHaveBeenCalledTimes(0)
    expect(received.statusCode)
      .toBe(401)
    expect(received.body)
      .toEqual(responses.auth.not_authenticated().body)
  })

  ~~~`
    The previous 2 tests should be split into an auth middleware describe.??
  `;~~~

  test('Invalid session id', async () => {
    db.get_sender_recipient.mockResolvedValueOnce({ sender_phone_number: null, recipient_exists: true })

    const received = await request(app)
      .post("/trpc/message.send")
      .set({ Cookie: `session=${session_id}${session_hash};` })
      .send({ ciphertext, recipient_phone_number })

    expect(db.get_sender_recipient)
      .toHaveBeenCalledOnce()
    expect(received.statusCode)
      .toBe(401)
    expect(received.body)
      .toEqual(responses.auth.not_authenticated().body)
  })

  test('Ciphertext too long', async () => {
    `The input validator will reject any ciphertext that is too long.`
  })

  test('Unknown recipient', async () => {
    db.get_sender_recipient.mockResolvedValueOnce({ sender_phone_number, recipient_exists: false })

    const received = await request(app)
      .post("/trpc/message.send")
      .set({ Cookie: `session=${session_id}${session_hash};` })
      .send({ ciphertext, recipient_phone_number })

    expect(db.get_sender_recipient)
      .toHaveBeenCalledOnce()
    expect(received.statusCode)
      .toBe(404)
    expect(received.body)
      .toEqual(ApiResponse.recipient_not_found().body)
  })

  test('Success', async () => {
    // Context : session_id is in the db.
    //         : recipient_phone_number is in the db.
    db.get_sender_recipient.mockResolvedValueOnce({ sender_phone_number, recipient_exists: true })

    const received = await request(app)
      .post("/trpc/message.send")
      .set({ Cookie: `session=${session_id}${session_hash};` })
      .send({ ciphertext, recipient_phone_number })

    const payload: Push = {
      type: 'ciphertext',
      ciphertext,
      sender: sender_phone_number,
      timestamp: 'get from db',
      id: 'get from db',
    }
    expect(db.get_sender_recipient)
      .toHaveBeenCalledOnce()
    expect(push.send)
      .toHaveBeenCalledOnce()
    expect(push.send)
      .toHaveBeenCalledWith(recipient_phone_number, payload)
    expect(received.statusCode)
      .toBe(200)
    expect(received.body)
      .toEqual(ApiResponse.success().body)

  })

  ~~~`
  Success is supposed to push the message, not just send a happy response
  ~~~`
})


// Server request:
// Get the profile of all users in your contacts.
// get_contact_profiles(contacts: [phone_number])
//   contacts.filter(has_account).map(phone_number => user_profile(phone_number))