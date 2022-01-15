import { CookieOptions } from "express"

export type CookieConfig = {
  options: CookieOptions
  [k: string]: any
}

export type SessionConfig = string

export type ResponseConfig = {
  type: number
  message: string
  data?: any
  cookie?: CookieConfig
  session?: SessionConfig
  code?: number
  get body(): { result: { data: Response }}
}
export type Response = {
  type: number
  message: string
  data?: any
}

const r = (config): ResponseConfig =>
  Object.assign(Object.create({
    get body() { return {
      result: { data: {
        type: config.type,
        message: config.message,
        ...( config.data && {data: config.data})
      }},
      // id: expect.toSatisfy(() => true) 
    }}
  }), config)



export default {
  'auth.request': {
    only_once_per_30s: () =>
      r({ type: 1.0, message: 'Can only issue a OTP once every 30 seconds' }),
    sent_sms_otp: () =>
      r({ type: 1.2, message: 'Sent SMS OTP' })
  },
  'auth.complete': {
    success: (session_string: string) =>
      r({ type: 2.0, message: 'Log in succeeded',
          session: session_string}),
    failure: () =>
      r({ type: 2.1, message: 'Log in failed' })
  },
  'auth': {
    not_authenticated: () =>
      r({ type: 3.0, message: 'Not authenticated',
          code: 401 })
  },
  'message.send': {
    success: () =>
      r({ type: 4.0, message: 'Message sent' }),
    recipient_not_found: () =>
      r({ type: 4.1, message: 'Recipient not found',
          code: 404 }),
  }
}
