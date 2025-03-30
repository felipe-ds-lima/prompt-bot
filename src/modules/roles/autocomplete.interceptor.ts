import { AutocompleteInteraction } from 'discord.js'
import { AutocompleteInterceptor as BaseAutocompleteInterceptor } from 'necord'

import { Injectable } from '@nestjs/common'

@Injectable()
export class AutocompleteInterceptor extends BaseAutocompleteInterceptor {
  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true)
    let choices: { name: string; value: string }[] = []

    if (focused.name === 'cargo') {
      const guild = interaction.guild
      const roles = guild?.roles.cache.map((role) => ({
        name: role.name,
        value: role.id,
      }))
      choices = roles ?? []
    }
    if (focused.name === 'emoji') {
      const guild = interaction.guild
      const emojis = guild?.emojis.cache.map((emoji) => ({
        name: emoji.name || emoji.identifier || emoji.id || '',
        value: emoji.id || emoji.identifier || emoji.name || '',
      }))
      choices = emojis ?? []
    }

    return interaction.respond(
      choices
        .filter((choice) => choice.name.startsWith(focused.value.toString()))
        .map((choice) => ({ name: choice.name, value: choice.value })),
    )
  }
}
