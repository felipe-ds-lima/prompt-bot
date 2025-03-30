import { StringOption } from 'necord'

export class RemoveRolesDto {
  @StringOption({
    name: 'cargo',
    description: 'Cargo a ser configurado.',
    autocomplete: true,
  })
  cargo: string

  @StringOption({
    name: 'emoji',
    description: 'Emoji a ser configurado.',
    autocomplete: true,
  })
  emoji: string

  @StringOption({
    name: 'message-id',
    description: 'ID da mensagem a ser configurada.',
  })
  messageId: string
}
