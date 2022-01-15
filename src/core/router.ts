import * as trpc from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { object, string } from 'zod'
import responses, { ResponseConfig } from '#/utilities/api-responses'
import { response_interpreter } from '#/core/response-interpreter'
import * as auth from '#/modules/auth'
import * as message from '#/modules/message'
import { TRPCError } from '@trpc/server'


export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({ res, req })
export type Context = trpc.inferAsyncReturnType<typeof createContext>
export const router = trpc.router<Context>()
.middleware<Context>(response_interpreter)


// The resolve functions' job is to:
//   Gather data from a module
//   Choose the right response

.mutation('auth.request', {
  input: object({
    phone_number: string()
  }),
  async resolve({ input: { phone_number }}) {
    const ApiResponse = responses['auth.request']
    const otp_valid_from = await auth.request_new_otp(phone_number)
    if (otp_valid_from === null)
      return ApiResponse.only_once_per_30s()
    else {
      await auth.send_sms_otp(phone_number, otp_valid_from)
      return ApiResponse.sent_sms_otp()
    }
  }
})

.mutation('auth.complete', {
  input: object({
    phone_number: string(),
    otp_attempt: string()
  }),
  async resolve({ input: { phone_number, otp_attempt }}) {
    const ApiResponse = responses['auth.complete']
    const success = await auth.verify_otp(phone_number, otp_attempt)
    if (success) {
      const session_string = await auth.create_session(phone_number)
      return ApiResponse.success(session_string)
    }
    else return ApiResponse.failure()

    /*
    Session invalidated whenever a new one is created.
    Multiple sessions possible if web/desktop interface added.
    */
  }
})

// @ts-ignore: The types don't want me to return void. See if it causes any problems.
.middleware<Context & { session_id: string }>(({ ctx, next }) => {
  const unauthorised = new TRPCError({ code: "UNAUTHORIZED" })

  // Get session_string from cookie.
  const session_string: string | undefined = ctx.req.cookies.session
  if (session_string === undefined)
    throw unauthorised

  // Validate session hash.
  const valid = auth.verify_session_hash(session_string)
  if (!valid)
    throw unauthorised

  // Set session_id in context.
  ;(ctx as Context & { session_id: string })
  .session_id = session_string.slice(0, auth.SESSION_ID_LENGTH)

  // Pass control to next middleware.
  return next()
})


// It's supposed to be pushing messages to clients.
// How tf do I do that?

.mutation('message.send', {
  input: object({
    ciphertext: string().max(message.MAX_MESSAGE_LENGTH),
    recipient_phone_number: string()
  }),
  async resolve({ ctx: { session_id }, input: { ciphertext, recipient_phone_number }}): Promise<ResponseConfig> {
    const ApiResponse = responses['message.send']
    // Ensure the session is valid. (DB)
    // Get sender_phone_number
    // Check recipient exists
    // Later, could add:
    //   Log if session_id invalid
    const { sender_phone_number, recipient_exists } = await auth.get_sender_recipient(session_id, recipient_phone_number)
    if (sender_phone_number === null)
      return responses['auth'].not_authenticated()

    if (!recipient_exists)
      return ApiResponse.recipient_not_found()
    
    message.send(sender_phone_number, recipient_phone_number, ciphertext)

    // Put it in the DB.
    // Push it
    // Don't delete from DB inbox
    // Until I get a response from the recipient.

    return ApiResponse.success()
  }
})

// Allow client to send PushReply to the server.
.mutation('reply-to-push', {
  input: object({}),
  async resolve({ ctx: { session_id }, input: {} }) {}
})

/*

Server should send all undelivered messages on login.
Server should send updated contact profiles on login. (Manage this in the same way as messages.)

Ideally, in a real world app, you'd want to test what happens whenever any service fails.

*/
