
export default {

  // cockroach sql --url "postgresql://url"
  development: {
    client: "cockroachdb",
    connection: {
      user: "user",
      password: "password",
      database: "second-shark-1300.sup",
      host: "free-tier7.aws-eu-west-1.cockroachlabs.cloud",
      port: 26257,
      ssl: true
    },
    migrations: { directory: "db/migrations" },
    seeds: { directory: "db/seeds" },
  },

  // cockroach sql --url "postgresql://root@localhost:26257/defaultdb?sslmode=disable"
  test: {
    client: 'cockroachdb',
    connection: {
      user: 'root',
      database: 'defaultdb',
      host: 'localhost',
      port: 26257,
      ssl: false
    },
    migrations: { directory: "db/migrations" },
    seeds: { directory: "db/seeds" },
  }

}
