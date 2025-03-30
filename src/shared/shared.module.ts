import { IntentsBitField, Partials } from 'discord.js'
import { NecordModule } from 'necord'

import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma/prisma.service'

@Global()
@Module({
  imports: [
    NecordModule.forRoot({
      token: process.env.DISCORD_TOKEN,
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessagePolls,
        IntentsBitField.Flags.MessageContent,
      ],
      partials: [Partials.Message, Partials.Reaction, Partials.Channel],
      development: [process.env.DISCORD_DEVELOPMENT_GUILD_ID],
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedModule {}
