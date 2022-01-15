import { MiddlewareResult } from '@trpc/server/dist/declarations/src/internals/middlewares'
import e from 'express'

export const use_express_middleware = <TContext>(express_middleware: e.RequestHandler) =>
  ({ ctx: { req, res }, next }): Promise<MiddlewareResult<TContext>> => 
    new Promise(resolve => express_middleware(req, res, () => resolve(next() as MiddlewareResult<TContext>)))