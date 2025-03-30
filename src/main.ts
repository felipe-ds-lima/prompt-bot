import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { DiscordErrorInterceptor } from './shared/discord-error.interceptor'

async function bootstrap() {
  const PORT = process.env.PORT ?? 3000
  const app = await NestFactory.create(AppModule)
  app.useGlobalInterceptors(new DiscordErrorInterceptor())
  await app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`)
  })
}
bootstrap().catch(console.error)
