import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Message,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  User,
} from 'discord.js'
import {
  Context,
  MessageCommand,
  MessageCommandContext,
  Options,
  SlashCommand,
  SlashCommandContext,
  TargetMessage,
  TargetUser,
  UserCommand,
  UserCommandContext,
} from 'necord'

import { Injectable, Logger, UseInterceptors } from '@nestjs/common'

import { CatsAutocompleteInterceptor } from './cats-autocomplete.interceptor'
import { CatDto } from './dtos/cats.dto'
import { TextDto } from './dtos/text.dto'

@Injectable()
export class ExamplesCommands {
  private readonly logger = new Logger(ExamplesCommands.name)

  @SlashCommand({
    name: 'ping',
    description: 'Responds with pong!',
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({
      content: 'Pong!',
      flags: [MessageFlags.Ephemeral],
    })
  }
  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  public async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: `The length of your text is: ${text.length}`,
      // flags: [MessageFlags.Ephemeral],
    })
  }

  @UserCommand({ name: 'Get avatar' })
  public async getUserAvatar(
    @Context() [interaction]: UserCommandContext,
    @TargetUser() user: User,
  ) {
    return interaction.reply({
      embeds: [
        {
          title: `Avatar of ${user.username}`,
          image: {
            url: user.displayAvatarURL({ size: 4096 }),
          },
        },
      ],
      // flags: [MessageFlags.Ephemeral],
    })
  }

  @UseInterceptors(CatsAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: CatDto,
  ) {
    return interaction.reply({
      content: `I found information on the breed of ${cat} cat!`,
      // flags: [MessageFlags.Ephemeral],
    })
  }

  @MessageCommand({ name: 'Copy Message' })
  public async copyMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    return interaction.reply({
      content: message.content,
      // flags: [MessageFlags.Ephemeral],
    })
  }

  @SlashCommand({
    name: 'modal',
    description: 'Open a modal',
  })
  public async onModal(@Context() [interaction]: SlashCommandContext) {
    return interaction.showModal(
      new ModalBuilder()
        .setTitle('What your fav pizza?')
        .setCustomId('pizza/12345')
        .setComponents([
          new ActionRowBuilder<TextInputBuilder>().addComponents([
            new TextInputBuilder()
              .setCustomId('pizza')
              .setLabel('???')
              .setStyle(TextInputStyle.Paragraph),
          ]),
        ]),
    )
  }

  @SlashCommand({
    name: 'buttons',
    description: 'A button',
  })
  public async onMessageComponent(
    @Context() [interaction]: SlashCommandContext,
  ) {
    return interaction.reply({
      // flags: [MessageFlags.Ephemeral],
      content: 'test',
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('BUTTON')
            .setLabel('Open Modal')
            .setStyle(ButtonStyle.Primary),
        ),
      ],
    })
  }

  @SlashCommand({
    name: 'clear',
    description: 'Limpa até 100 mensagens do chat.',
  })
  public async onClear(@Context() [interaction]: SlashCommandContext) {
    const member = interaction.member

    if (
      !interaction.guild ||
      !member ||
      !('permissions' in member) ||
      !(member as GuildMember).permissions.has(
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      return interaction.reply({
        content: '🚫 Você não tem permissão para usar este comando.',
        flags: [MessageFlags.Ephemeral],
      })
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }) // Dar tempo pro processo

    try {
      const channel = interaction.channel
      if (!channel || !channel.isTextBased()) {
        return interaction.editReply(
          '❌ Este comando só pode ser usado em canais de texto.',
        )
      }

      const messages = await channel.messages.fetch({ limit: 100 })

      if (!messages || messages.size === 0) {
        return interaction.editReply(
          '📭 Nenhuma mensagem encontrada para limpar.',
        )
      }
      const deletionResults = await Promise.allSettled(
        messages.map((message) => {
          if (message.deletable) {
            return message.delete()
          }
          return Promise.resolve()
        }),
      )

      const successCount = deletionResults.filter(
        (result) => result.status === 'fulfilled',
      ).length
      const failCount = deletionResults.filter(
        (result) => result.status === 'rejected',
      ).length

      if (failCount > 0) {
        this.logger.warn(`${failCount} mensagens não puderam ser apagadas.`)
      }

      await interaction.editReply(
        `✅ ${successCount} mensagens apagadas.\n${
          failCount > 0
            ? `⚠️ ${failCount} mensagens não puderam ser removidas (provavelmente muito antigas ou sem permissão).`
            : ''
        }`,
      )
    } catch (error) {
      this.logger.error('Erro ao limpar mensagens:', error)
      await interaction.editReply(
        '❌ Ocorreu um erro ao tentar limpar as mensagens.',
      )
    }
  }
}
