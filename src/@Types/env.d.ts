/* eslint-disable @typescript-eslint/naming-convention */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    PORT: string
    DATABASE_URL: string
    CLIENT_ID: string
    CLIENT_SECRET: string
    PUBLIC_KEY: string
    DISCORD_TOKEN: string
    DISCORD_DEVELOPMENT_GUILD_ID: string
  }
}
