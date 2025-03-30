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
import { GiveRolesDto } from './dtos/give-roles.dto'
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
    defaultMemberPermissions: [PermissionFlagsBits.ManageRoles],
  })
  public async onConfigureRoles(
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
    defaultMemberPermissions: [PermissionFlagsBits.ManageRoles],
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
    defaultMemberPermissions: [PermissionFlagsBits.ManageRoles],
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
        const emoji =
          emojis.find((emoji) => emoji.id === roleConfig.emojiId) ||
          roleConfig.emojiId
        return `\n==========================\nCargo: ${role?.name}\nEmoji: ${emoji?.toString()}\nID da mensagem: ${roleConfig.messageId}`
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

  @UseInterceptors(AutocompleteInterceptor)
  @SlashCommand({
    name: 'dar-cargo',
    description: 'Dá um cargo a um membro.',
    defaultMemberPermissions: [PermissionFlagsBits.ManageRoles],
  })
  public async onGiveRole(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: GiveRolesDto,
  ) {
    const { cargo, membro } = options

    if (
      this.canNotManageRoles(
        interaction.guild as Guild,
        interaction.member as GuildMember,
      )
    ) {
      await this.postInModerationChannel(
        interaction.guild as Guild,
        interaction.member as GuildMember,
        `${interaction.member?.user.username} usou o comando /dar-cargo`,
      )
      return interaction.editReply({
        content: '🚫 Você não tem permissão para usar este comando.',
      })
    }
    const guild = interaction.guild as Guild
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

    this.logger.log(
      `Iniciando comando dar-cargo. Cargo: ${cargo}, Membro: ${membro}`,
    )

    try {
      if (membro !== 'all') {
        this.logger.log(
          `Tentando adicionar cargo para membro específico: ${membro}`,
        )
        const member = guild.members.cache.get(membro)
        if (!member) {
          this.logger.warn(`Membro não encontrado: ${membro}`)
          return interaction.editReply({
            content: '🚫 Membro não encontrado.',
          })
        }

        await member.roles.add(cargo)
        this.logger.log(
          `Cargo ${cargo} adicionado com sucesso para ${member.user.username}`,
        )
        return interaction.editReply({
          content: `✅ Cargo ${cargo} dado a ${member.user.username}.`,
        })
      } else {
        this.logger.log('Iniciando adição de cargo para todos os membros')
        await interaction.editReply({
          content:
            '⏳ Adicionando cargo a todos os membros... Isso pode demorar um pouco.',
        })

        this.logger.log('Iniciando fetch de membros')
        const members = await guild.members.fetch()
        this.logger.log(`Total de membros encontrados: ${members.size}`)

        let sucessos = 0
        let falhas = 0

        for (const [, member] of members) {
          if (member.user.bot) {
            this.logger.debug(`Pulando bot: ${member.user.username}`)
            continue
          }

          try {
            this.logger.debug(
              `Tentando adicionar cargo para: ${member.user.username}`,
            )
            await member.roles.add(cargo)
            sucessos++

            if (sucessos % 10 === 0) {
              this.logger.log(
                `Progresso: ${sucessos} membros processados com sucesso`,
              )
              await interaction.editReply({
                content: `⏳ Processando... ${sucessos} membros atualizados.`,
              })
            }
          } catch (error) {
            falhas++
            this.logger.error(
              `Erro ao adicionar cargo para ${member.user.username}:`,
              error instanceof Error ? error.stack : error,
            )
          }
        }

        this.logger.log(
          `Processo finalizado. Sucessos: ${sucessos}, Falhas: ${falhas}`,
        )
        return interaction.editReply({
          content: `✅ Processo finalizado!\nSucesso: ${sucessos} membros\nFalhas: ${falhas} membros`,
        })
      }
    } catch (error) {
      this.logger.error(
        'Erro crítico no comando dar-cargo:',
        error instanceof Error ? error.stack : error,
      )
      return interaction.editReply({
        content: '❌ Ocorreu um erro ao executar o comando.',
      })
    }
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

    const roles = await this.prisma.roleByEmoji.findMany({
      where: {
        OR: [
          {
            guildId: reaction.message.guild?.id,
            emojiId: reaction.emoji.id || 'any',
            messageId: reaction.message.id,
          },
          {
            guildId: reaction.message.guild?.id,
            emojiId: 'any',
            messageId: reaction.message.id,
          },
        ],
      },
    })
    for (const role of roles) {
      console.log(
        `guildId: ${reaction.message.guild?.id}, roleId: ${role?.roleId}, emojiId: ${role?.emojiId}, messageId: ${role?.messageId}`,
      )
    }

    if (!roles || roles.length === 0) return

    const member = reaction.message.guild?.members.cache.get(user.id)
    console.log(`member: ${member?.user.username}`)
    if (!member) return

    for (const role of roles) {
      if (!member.roles.cache.has(role.roleId)) {
        await member.roles.add(role.roleId)
        const roleName =
          reaction.message.guild?.roles.cache.get(role.roleId)?.name ||
          'Cargo não encontrado'
        await this.postInModerationChannel(
          reaction.message.guild as Guild,
          member,
          `✅ ${member.user.username} recebeu o cargo ${roleName}`,
        )
      }
    }
  }
}
