import { StringOption } from 'necord'

export class AddRolesDto {
  @StringOption({
    name: 'cargo',
    description: 'Cargo a ser configurado.',
    autocomplete: true,
    required: true,
  })
  cargo: string

  @StringOption({
    name: 'emoji',
    description: 'Emoji a ser configurado.',
    autocomplete: true,
    required: true,
  })
  emoji: string

  @StringOption({
    name: 'message-id',
    description: 'ID da mensagem a ser configurada.',
    required: true,
  })
  messageId: string
}
