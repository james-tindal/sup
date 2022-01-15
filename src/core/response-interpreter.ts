
import { Context } from '#/core/router'
import apiResponses, { CookieConfig, SessionConfig, Response, ResponseConfig } from '#/utilities/api-responses'

const cookie_string = (obj: Record<string, any>): string =>
  Object.entries(obj).reduce<Array<string>>((acc, [k, v]) => [...acc, `${k}=${v}`], []).join('; ')

// mung.json accepts a callback
// and returns a middleware which
// manipulates values passed res.end
// according to the callback
const mung = {
  json: (cb: (body: ResponseConfig, ctx) => Response) => {
    return ({ ctx, next }) => {
      const { req, res } = ctx
      const original = res.end
      res.end = json => original.call(res, JSON.stringify({ result: { data: middle(JSON.parse(json), ctx, cb) }}))
      return next()
    }
}}

const middle = (body, ctx, cb) => {
  const { error, result } = body
  if (result) {
    const config: ResponseConfig = result.data
    const reponse: Response = cb( config, ctx )
    return reponse
  }
  if (error.data.code === 'UNAUTHORIZED') {
    const reponse: Response = cb( apiResponses.auth.not_authenticated(), ctx )
    return reponse
  }
  else return body
}

export const response_interpreter = mung.json((config: ResponseConfig, ctx: Context) => {
  if (config === undefined) throw new Error('You must return a ResponseConfig object from your resolve function.')
  const { req, res } = ctx
  const fns = {
    cookie(config: CookieConfig) {
      const { options, ...pairs } = config
      Object.entries(pairs).forEach(([k, v]) => res.cookie(k, v, options))
    },
    session(session_string: SessionConfig) {
      this.cookie({ session: session_string, options: { httpOnly: true, sameSite: true, secure: false }})
    },
    code(code: number) {
      res.statusCode = code
    }
  }

  Object.entries(config).forEach(([k, v]) => fns[k]?.(v))

  const { type, message, data } = config
  return { type, message, data }
})
