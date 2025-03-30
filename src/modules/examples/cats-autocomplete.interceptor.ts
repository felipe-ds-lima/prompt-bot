import { AutocompleteInteraction } from 'discord.js'
import { AutocompleteInterceptor } from 'necord'

import { Injectable } from '@nestjs/common'

@Injectable()
export class CatsAutocompleteInterceptor extends AutocompleteInterceptor {
  public transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true)
    let choices: string[] = []

    if (focused.name === 'cat') {
      choices = ['Siamese', 'Persian', 'Maine Coon']
    }

    return interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value.toString()))
        .map((choice) => ({ name: choice, value: choice })),
    )
  }
}
