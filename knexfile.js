// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: 'postgres://localhost/blueribbon',
    migrations: {
      directory: __dirname + '/db/migrations'
    }
  },

  staging: {
    client: 'pg',
    connection: {
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      user: process.env.DBUSER,
      password: process.env.PGPASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL + `?ssl=true`,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './db/migrations'
    }
  }

};
