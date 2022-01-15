import Knex from 'knex'
import sql from '#/utilities/sql-escaper'
import knexfile from '#/../knexfile'

export const knex = Knex(knexfile[process.env.NODE_ENV])
export const raw = (chunks, ...subs) => knex.raw(sql(chunks, ...subs))