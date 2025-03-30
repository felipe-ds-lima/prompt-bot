import {
  Context,
  Button,
  ButtonContext,
  StringSelect,
  StringSelectContext,
  SelectedStrings,
} from 'necord'

import { Injectable } from '@nestjs/common'

@Injectable()
export class ExamplesComponents {
  @Button('BUTTON')
  public onButtonClick(@Context() [interaction]: ButtonContext) {
    return interaction.reply({ content: 'Button clicked!' })
  }

  @StringSelect('SELECT_MENU')
  public onSelectMenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() values: string[],
  ) {
    return interaction.reply({ content: `You selected: ${values.join(', ')}` })
  }
}
