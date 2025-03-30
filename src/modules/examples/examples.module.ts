import { Module } from '@nestjs/common'

import { ExamplesCommands } from './examples.commands'
import { ExamplesComponents } from './examples.components'
import { ExamplesModals } from './examples.modal'

@Module({
  providers: [ExamplesCommands, ExamplesComponents, ExamplesModals],
})
export class ExamplesModule {}
