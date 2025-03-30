import { Module } from '@nestjs/common'

import { RolesCommands } from './roles.commands'

@Module({
  providers: [RolesCommands],
})
export class RolesModule {}
