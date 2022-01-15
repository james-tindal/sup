import express from 'express'
import cookieParser from 'cookie-parser'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { router, createContext } from '#/core/router'


export const App = () => express()
.use(cookieParser())
.use('/trpc', createExpressMiddleware({ router, createContext }))
