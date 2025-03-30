import { Module } from '@nestjs/common'

import { ModulesModule } from './modules/modules.module'
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [SharedModule, ModulesModule],
})
export class AppModule {}
