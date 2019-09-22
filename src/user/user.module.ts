import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [UserResolver],
  imports: [PrismaModule],
})
export class UserModule {}
