import { StringOption } from 'necord'

export class GiveRolesDto {
  @StringOption({
    name: 'cargo',
    description: 'Cargo a ser configurado.',
    autocomplete: true,
    required: true,
  })
  cargo: string

  @StringOption({
    name: 'membro',
    description: 'Membro a ser configurado.',
    autocomplete: true,
    required: true,
  })
  membro: string
}
