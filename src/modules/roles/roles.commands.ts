import {
  Guild,
  GuildMember,
  MessageFlags,
  MessageReaction,
  PermissionFlagsBits,
  User,
} from 'discord.js'
import { Context, On, Options, SlashCommand, SlashCommandContext } from 'necord'
import { PrismaService } from 'src/shared/prisma/prisma.service'

import { Injectable, Logger, UseInterceptors } from '@nestjs/common'

import { AutocompleteInterceptor } from './autocomplete.interceptor'
import { AddRolesDto } from './dtos/add-roles.dto'
import { RemoveRolesDto } from './dtos/remove-roles.dto'

@Injectable()
export class RolesCommands {
  private readonly logger = new Logger(RolesCommands.name)

  constructor(private readonly prisma: PrismaService) {}

  canNotManageRoles(guild: Guild, member: GuildMember) {
    if (!guild || !member) {
      return false
    }
    return (
      !member ||
      !('permissions' in member) ||
      !member.permissions.has(PermissionFlagsBits.ManageRoles)
    )
  }

  async postInModerationChannel(
    guild: Guild,
    member: GuildMember,
    message: string,
  ) {
    if (!guild || !member) {
      return false
    }

    const securityChannel = guild.channels.cache.find((channel) =>
      [
        'segurança',
        'security',
        'moderation',
        'moderação',
        'logs',
        'audit',
        'auditoria',
      ].includes(channel.name.toLowerCase()),
    )

    if (!securityChannel || !('send' in securityChannel)) {
      return false
    }

    await securityChannel.send(message)
  }

  @UseInterceptors(AutocompleteInterceptor)
  @SlashCommand({
    name: 'configurar-cargos',
    description:
      'Configura os cargos do servidor para serem atribuídos por reações.',
  })
  public async onPing(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: AddRolesDto,
  ) {
    const { cargo, emoji, messageId } = options
    try {
      const member = interaction.member as GuildMember
      const guild = interaction.guild as Guild
      if (this.canNotManageRoles(guild, member)) {
        await this.postInModerationChannel(
          guild,
          member,
          `${interaction.member?.user.username} usou o comando /configurar-cargos`,
        )
        return interaction.reply({
          content: '🚫 Você não tem permissão para usar este comando.',
          flags: [MessageFlags.Ephemeral],
        })
      }
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

      const roleExists = await this.prisma.roleByEmoji.findFirst({
        where: {
          guildId: guild.id,
          roleId: cargo,
          emojiId: emoji,
          messageId,
        },
      })
      if (roleExists) {
        return interaction.editReply({
          content: '⚠️ Cargo já configurado.',
        })
      }

      await this.prisma.roleByEmoji.create({
        data: {
          guildId: guild.id,
          emojiId: emoji,
          roleId: cargo,
          messageId,
        },
      })

      return interaction.editReply({
        content: `✅ Cargo configurado com sucesso!`,
      })
    } catch (error) {
      this.logger.error(error)
      return interaction.editReply({
        content: '❌ Erro ao configurar o cargo.',
      })
    }
  }

  @UseInterceptors(AutocompleteInterceptor)
  @SlashCommand({
    name: 'remover-cargo',
    description:
      'Remove um cargo configurado pelo cargo, ou emoji, ou id da mensagem, ou todos.',
  })
  public async onRemoveRole(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: RemoveRolesDto,
  ) {
    const { cargo, emoji, messageId } = options

    try {
      const member = interaction.member as GuildMember
      const guild = interaction.guild as Guild
      if (this.canNotManageRoles(guild, member)) {
        await this.postInModerationChannel(
          guild,
          member,
          `${interaction.member?.user.username} usou o comando /remover-cargo`,
        )
        return interaction.reply({
          content: '🚫 Você não tem permissão para usar este comando.',
        })
      }
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

      const role = guild.roles.cache.get(cargo)
      if (!role) {
        return interaction.editReply({
          content: '🚫 Cargo não encontrado.',
        })
      }

      const allFind = await this.prisma.roleByEmoji.findMany({
        where: {
          guildId: guild.id,
          roleId: cargo || undefined,
          emojiId: emoji || undefined,
          messageId: messageId || undefined,
        },
      })

      if (allFind.length === 0) {
        return interaction.editReply({
          content: '🚫 Nenhum cargo encontrado.',
        })
      }

      await this.prisma.roleByEmoji.deleteMany({
        where: {
          guildId: guild.id,
          roleId: cargo || undefined,
          emojiId: emoji || undefined,
          messageId: messageId || undefined,
        },
      })

      const sufix = allFind.length > 1 ? 's' : ''
      const sufix2 = allFind.length > 1 ? 'ões' : 'ão'
      return interaction.editReply({
        content: `✅ ${allFind.length} configuraç${sufix2} removida${sufix}.`,
      })
    } catch (error) {
      this.logger.error(error)
      return interaction.editReply({
        content: '❌ Erro ao remover o cargo.',
      })
    }
  }

  @SlashCommand({
    name: 'listar-cargos',
    description: 'Lista todos os cargos configurados.',
  })
  public async onListRoles(@Context() [interaction]: SlashCommandContext) {
    const guild = interaction.guild as Guild
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })
    const roles = guild.roles.cache
    const emojis = guild.emojis.cache

    if (this.canNotManageRoles(guild, interaction.member as GuildMember)) {
      await this.postInModerationChannel(
        guild,
        interaction.member as GuildMember,
        `${interaction.member?.user.username} usou o comando /listar-cargos`,
      )
      return interaction.editReply({
        content: '🚫 Você não tem permissão para usar este comando.',
      })
    }

    const rolesConfig = await this.prisma.roleByEmoji.findMany({
      where: {
        guildId: guild.id,
      },
    })

    const rolesList = await Promise.all(
      rolesConfig.map(async (roleConfig) => {
        const role = roles.find((role) => role.id === roleConfig.roleId)
        const emoji = emojis.find((emoji) => emoji.id === roleConfig.emojiId)
        return `\n==========================\nCargo: ${role?.name}\nEmoji: ${emoji?.toString()}\nID da mensagem: ${roleConfig.messageId}\n\n`
      }),
    )

    if (rolesList.length === 0) {
      return interaction.editReply({
        content: '🚫 Nenhum cargo configurado.',
      })
    }

    return interaction.editReply({
      content: `Cargos configurados: ${rolesList.join('\n')}`,
    })
  }

  @On('messageReactionAdd')
  async onReactionAdd(@Context() [reaction, user]: [MessageReaction, User]) {
    // Evita bots
    if (user.bot) return

    // Garante que o conteúdo da mensagem esteja carregado
    if (reaction.partial) {
      try {
        await reaction.fetch()
      } catch (error) {
        console.error('Erro ao buscar reação parcial:', error)
        return
      }
    }

    const role = await this.prisma.roleByEmoji.findFirst({
      where: {
        guildId: reaction.message.guild?.id,
        emojiId: reaction.emoji.id || undefined,
        messageId: reaction.message.id,
      },
    })

    if (!role) return

    const member = reaction.message.guild?.members.cache.get(user.id)

    if (!member) return

    if (!member.roles.cache.has(role.roleId)) {
      await member.roles.add(role.roleId)
      await this.postInModerationChannel(
        reaction.message.guild as Guild,
        member,
        `✅ ${member.user.username} recebeu o cargo ${role.roleId}`,
      )
      return
    }
  }
}
