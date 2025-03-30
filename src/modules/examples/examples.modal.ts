import { Context, Modal, ModalContext } from 'necord'

import { Injectable } from '@nestjs/common'

@Injectable()
export class ExamplesModals {
  @Modal('pizza/:value')
  public onModal(@Context() [interaction]: ModalContext) {
    return interaction.reply({
      content: `Your fav pizza : ${interaction.fields.getTextInputValue('pizza')}`,
    })
  }
}
