import { Parent, ResolveProperty, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../graphql.schema.generated';

@Resolver('User')
export class UserResolver {
  constructor(private readonly prisma: PrismaService) {}

  @ResolveProperty()
  async post(@Parent() { id }: User) {
    return this.prisma.client.user({ id }).post();
  }
}
