---
title: Building NestJS app boilerplate - Authentication, Validation, GraphQL and Prisma
published: false
cover_image: https://thepracticaldev.s3.amazonaws.com/i/whtmfhi1tmpsq1vgblhc.jpg
description: 
tags: #node, #javascript, #graphql, #webdev
---

The boilerplate app created by this tutorial is [here](https://github.com/nikitakot/nestjs-boilerplate).

# ⚠️⚠️⚠️ Update - 06 April 2020

NestJS version 7 was recently [released](https://trilon.io/blog/announcing-nestjs-7-whats-new). Many thanks to 
[johnbiundo](https://dev.to/johnbiundo) who [posted](https://dev.to/johnbiundo/comment/nck1) what changes have to be done for this version update. The github repository is also updated, you can check the changes I've made [here](https://github.com/nikitakot/nestjs-boilerplate/commit/7953e674d519d48f36ebf60f332e1289044807a7).

# Intro

[NestJS](https://nestjs.com/) is a relatively new framework in the Node world. Inspired by Angular and built on top of Express with full TypeScript support, it provides a scalable and maintainable architecture to your applications. NestJS also supports [GraphQL](https://graphql.org/) - a robust query language for APIs with a dedicated, ready to use, `@nestjs/graphql` module (in fact, the module is just a wrapper around Apollo server).

In this tutorial we're going to build a boilerplate with all the basic features you will need to develop more complex applications. We will use [Prisma](https://www.prisma.io/) as a database layer since it works extremely well with GraphQL APIs allowing you to map Prisma resolver to GraphQl API resolvers easily.

By the end of this article we will create a simple blog application, which will allow users to register, log-in and create posts.

# Getting Started

### NestJS

To start playing with NestJS you should have node (version >= 8.9.0) and npm installed. You can download and install Node from the [official website](https://nodejs.org/).

After you have node and npm installed, let's install NestJS CLI and initialise a new project.

```shell
$ npm i -g @nestjs/cli
$ nest new nestjs-boilerplate
$ cd nestjs-boilerplate
```

During the installation process you will be asked what package manager you want to use (yarn or npm). In this tutorial I'll be using npm, but if you prefer yarn, go for it.

Now let's run `npm start`. It will start the application on port 3000, so opening [http://localhost:3000](http://localhost:3000) in a browser will display a "Hello World!" message.

### GraphQL

As mentioned above, we will use `@nestjs/graphql` module to setup GraphQL for our API.

```shell
$ npm i --save @nestjs/graphql apollo-server-express graphql-tools graphql
```

After the packages are installed, let's create a configuration file for our GraphQL server.

```shell
$ touch src/graphql.options.ts
```

The configuration will be passed to the underlying Apollo instance by NestJS. A more in depth documentation can be found [here](https://www.apollographql.com/docs/apollo-server/api/apollo-server/).

**src/graphql.options.ts**
```typescript
import { GqlModuleOptions, GqlOptionsFactory } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { join } from 'path';

@Injectable()
export class GraphqlOptions implements GqlOptionsFactory {
  createGqlOptions(): Promise<GqlModuleOptions> | GqlModuleOptions {
    return {
      context: ({ req, res }) => ({ req, res }),
      typePaths: ['./src/*/*.graphql'], // path for gql schema files
      installSubscriptionHandlers: true,
      resolverValidationOptions: {
        requireResolversForResolveType: false,
      },
      definitions: { // will generate .ts types from gql schema files
        path: join(process.cwd(), 'src/graphql.schema.generated.ts'),
        outputAs: 'class',
      },
      debug: true,
      introspection: true,
      playground: true,
      cors: false,
    };
  }
}
```

Then register `GraphQLModule` and pass the configuration in application's main `AppModule` module.

**src/app.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlOptions } from './graphql.options';

@Module({
  imports: [
    GraphQLModule.forRootAsync({
      useClass: GraphqlOptions,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

You may have noticed I removed `AppController` and `AppService` from the main module. We don't need them since we will be using GraphQL instead of a REST api. The corresponding files can be deleted as well.

To test this setup out, let's create a simple graphql API schema.

```shell
$ mkdir src/schema 
$ touch src/schema/gql-api.graphql
```
**src/schema/gql-api.graphql**
```graphql
type Author {
    id: Int!
    firstName: String
    lastName: String
    posts: [Post]
}

type Post {
    id: Int!
    title: String!
    votes: Int
}

type Query {
    author(id: Int!): Author
}
```

Running `npm start` will do two things: 
- Generate `src/graphql.schema.generated.ts` with typescript types which can be used in our source code.
- Launch the server on port 3000. 

We can now navigate to [http://localhost:3000/graphql](http://localhost:3000/graphql) (default GraphQL API path) to see the GraphQL Playground.

<img src="https://thepracticaldev.s3.amazonaws.com/i/gccnoc11iw8fv6gvnld2.png" alt="graphql playground" width="542"/>

### Prisma

To run Prisma we need to install [Docker](https://www.docker.com/), you can follow the installation guide [here](https://docs.docker.com/install/). 

> *Linux users - you need to install [docker-compose](https://docs.docker.com/compose/install/) separately*. 

We will be running two containers - one for the actual database and a second one for the prisma service.

Create a docker compose configuration file in the root project directory.

```shell
$ touch docker-compose.yml
```

And put the following configuration there.

**docker-compose.yml**

```yml
version: '3'
services:
  prisma:
    image: prismagraphql/prisma:1.34
    ports:
      - '4466:4466'
    environment:
      PRISMA_CONFIG: |
        port: 4466
        databases:
          default:
            connector: postgres
            host: postgres
            port: 5432
            user: prisma
            password: prisma
  postgres:
    image: postgres:10.3
    environment:
      POSTGRES_USER: prisma
      POSTGRES_PASSWORD: prisma
    volumes:
      - postgres:/var/lib/postgresql/data
volumes:
  postgres: ~
```

Run docker compose in the root directory of the project. Docker compose will download images and start containers.

```shell
$ docker-compose up -d
```

The Prisma server is now connected to the local Postgres instance and runs on port 4466. Opening [http://localhost:4466](http://localhost:4466) in a browser will open the Prisma GraphQL playground.

Now let's install the Prisma CLI and the Prisma client helper library. 

```shell
$ npm install -g prisma 
$ npm install --save prisma-client-lib
```

And initialise Prisma in our project root folder.

```shell
$ prisma init --endpoint http://localhost:4466
```

Prisma initialisation will create the `datamodel.prisma` and `prisma.yml` files in the root of our project. The `datamodel.prisma` file contains the database schema and `prisma.yml` contains the prisma client configurations.

Add the following code to `prisma.yml` to generate `typescript-client` so we can query our database.

**prisma.yml**
```yml
endpoint: http://localhost:4466
datamodel: datamodel.prisma
generate:
  - generator: typescript-client
    output: ./generated/prisma-client/
```

Then run `prisma deploy` to deploy your service. It will initialise the schema specified in `datamodel.prisma` and generate the prisma client.

```shell
$ prisma deploy
```

Go to [http://localhost:4466/_admin](http://localhost:4466/_admin) to open the prisma admin tool, a slightly more convenient way to view and edit your data compared to the graphql playground.

### Prisma Module

This step is pretty much optional as you can use the generated prisma client as it is in other modules/services etc. but making a prisma module will make it easier to configure or change something in the future.

Let's use the NestJS CLI to create a prisma module and a service. The CLI will automatically create the files boilerplate's files and do the initial module metadata setup for us.

```shell
$ nest g module prisma 
$ nest g service prisma
```

Then let's setup `PrismaService`.

**src/prisma/prisma.service.ts**
```typescript
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma-client';

@Injectable()
export class PrismaService {
  client: Prisma;

  constructor() {
    this.client = new Prisma();
  }
}
```

And export it in **src/prisma/prisma.module.ts**.

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Great! We are done with the initial setup, let's now continue implementing authentication.

# Shemas

### Database schema

Let's store our boilerplate app schema in **database/datamodel.prisma**. We can also delete the old datamodel file in the root of the project with default schema.

```shell
$ rm datamodel.prisma
$ mkdir database
$ touch database/datamodel.prisma
```

**database/datamodel.prisma**

```graphql
type User {
    id: ID! @id
    email: String! @unique
    password: String!
    post: [Post!]!
    createdAt: DateTime! @createdAt
    updatedAt: DateTime! @updatedAt
}

type Post {
    id: ID! @id
    title: String!
    body: String
    author: User!
    createdAt: DateTime! @createdAt
    updatedAt: DateTime! @updatedAt
}
```

Then let's modify **prisma.yml** and define path to our new schema.

**prisma.yml**

```yml
endpoint: http://localhost:4466
datamodel:
  - database/datamodel.prisma
generate:
  - generator: typescript-client
    output: ./generated/prisma-client/
```

After deploying the schema, the prisma client will be automatically updated and you should see appropriate changes in prisma admin [http://localhost:4466/_admin](http://localhost:4466/_admin).

```ssh
$ prisma deploy
```

### API schema

Let's put the following graphql API schema in **src/schema/gql-api.graphql**.

**src/schema/gql-api.graphql**

```graphql
type User {
  id: ID!
  email: String!
  post: [Post!]!
  createdAt: String!
  updatedAt: String!
}

type Post {
  id: ID!
  title: String!
  body: String
  author: User!
}

input SignUpInput {
  email: String!
  password: String!
}

input LoginInput {
  email: String!
  password: String!
}

input PostInput {
  title: String!
  body: String
}

type AuthPayload {
  id: ID!
  email: String!
}

type Query {
  post(id: ID!): Post!
  posts: [Post!]!
}

type Mutation {
  signup(signUpInput: SignUpInput): AuthPayload!
  login(loginInput: LoginInput): AuthPayload!
  createPost(postInput: PostInput): Post!
}
```

Now launch the app with `npm start` so it will generate typescript types from the schema above.

# Modules

### Auth Module

First, we need to install some additional packages to implement passport JWT in our NestJS app.

```shell
$ npm install --save @nestjs/passport passport @nestjs/jwt passport-jwt cookie-parser bcryptjs class-validator class-transformer
$ npm install @types/passport-jwt --save-dev
```

Create `AuthModule`, `AuthService`, `AuthResolver`, `JwtStrategy` and `GqlAuthGuard` files.

```shell
$ nest g module auth 
$ nest g service auth
$ nest g resolver auth
$ touch src/auth/jwt.strategy.ts
$ touch src/auth/graphql-auth.guard.ts 
```

**src/auth/auth.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../../generated/prisma-client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validate({ id }): Promise<User> {
    const user = await this.prisma.client.user({ id });
    if (!user) {
      throw Error('Authenticate validation error');
    }
    return user;
  }
}
```

The validate method of the auth service will check if a user id from a JWT token is persisted in the database. 

**src/auth/jwt.strategy.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.token;
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload) {
    return this.authService.validate(payload);
  }
}
```

Here we define where our token should be taken from and how to validate it. We will be passing the JWT secret via environment variable so you will be launching the app with `JWT_SECRET=your_secret_here npm run start`.

To be able to parse cookies we need to define global `cookie-parser` middleware.

**src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3000);
}
bootstrap();
```

Now let's create a validation class that we will use later and put some email/password validations there.

```shell
$ touch src/auth/sign-up-input.dto.ts
```

**src/auth/sign-up-input.dto.ts**

```typescript
import { IsEmail, MinLength } from 'class-validator';
import { SignUpInput } from '../graphql.schema.generated';

export class SignUpInputDto extends SignUpInput {
  @IsEmail()
  readonly email: string;

  @MinLength(6)
  readonly password: string;
}
```

To make validation work, we need to globally define the validation pipe from `@nestjs/common` package.

**src/app.module.ts**

```typescript
import { Module, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlOptions } from './graphql.options';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    GraphQLModule.forRootAsync({
      useClass: GraphqlOptions,
    }),
    PrismaModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

To easily access request and user objects from the graphql context we can create decorators. More info about custom decorators can be found [here](https://docs.nestjs.com/custom-decorators).

**src/shared/decorators/decorators.ts**

```typescript
import { createParamDecorator } from '@nestjs/common';
import { Response } from 'express';
import { User } from '../../../generated/prisma-client';

export const ResGql = createParamDecorator(
  (data, [root, args, ctx, info]): Response => ctx.res,
);

export const GqlUser = createParamDecorator(
  (data, [root, args, ctx, info]): User => ctx.req && ctx.req.user,
);
```

**src/auth/auth.resolver.ts**

```typescript
import * as bcryptjs from 'bcryptjs';
import { Response } from 'express';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { LoginInput } from '../graphql.schema.generated';
import { ResGql } from '../shared/decorators/decorators';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpInputDto } from './sign-up-input.dto';

@Resolver('Auth')
export class AuthResolver {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Mutation()
  async login(
    @Args('loginInput') { email, password }: LoginInput,
    @ResGql() res: Response,
  ) {
    const user = await this.prisma.client.user({ email });
    if (!user) {
      throw Error('Email or password incorrect');
    }

    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) {
      throw Error('Email or password incorrect');
    }

    const jwt = this.jwt.sign({ id: user.id });
    res.cookie('token', jwt, { httpOnly: true });

    return user;
  }

  @Mutation()
  async signup(
    @Args('signUpInput') signUpInputDto: SignUpInputDto,
    @ResGql() res: Response,
  ) {
    const emailExists = await this.prisma.client.$exists.user({
      email: signUpInputDto.email,
    });
    if (emailExists) {
      throw Error('Email is already in use');
    }
    const password = await bcryptjs.hash(signUpInputDto.password, 10);

    const user = await this.prisma.client.createUser({ ...signUpInputDto, password });

    const jwt = this.jwt.sign({ id: user.id });
    res.cookie('token', jwt, { httpOnly: true });

    return user;
  }
}
```

And finally the authentication logic. We are using `bcryptjs` to hash
and secure out passwords and `httpOnly` cookie to prevent XSS attacks on
the client side.

If we want to make some endpoints accessible only for signed-up users we need
to create an authentication guard and then use it as a decorator above an endpoint
definition.

**src/auth/graphql-auth.guard.ts**

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

Now let's wire up everything in `AuthModule`.

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: 3600, // 1 hour
      },
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
})
export class AuthModule {}
```

Cool, authentication is ready! Start the server and try to create a user, log-in and check cookies in a browser. 
If you see `token` cookie everything works as expected.

### Post module

Let's add some basic logic to our app. Authorized users will be able
to create posts that will be readable to everyone. 

```shell
$ nest g module post
$ nest g resolver post
$ touch src/post/post-input.dto.ts
```

First let's define resolvers for all `Post` fields and add a simple validation for `createPost` mutation.

**src/post/post-input.dto.ts**

```typescript
import { IsString, MaxLength, MinLength } from 'class-validator';
import { PostInput } from '../graphql.schema.generated';

export class PostInputDto extends PostInput {
  @IsString()
  @MinLength(10)
  @MaxLength(60)
  readonly title: string;
}
```

**src/post/post.resolver.ts**

```typescript
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveProperty,
  Resolver,
} from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { Post } from '../graphql.schema.generated';
import { GqlUser } from '../shared/decorators/decorators';
import { User } from '../../generated/prisma-client';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/graphql-auth.guard';
import { PostInputDto } from './post-input.dto';

@Resolver('Post')
export class PostResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query()
  async post(@Args('id') id: string) {
    return this.prisma.client.post({ id });
  }

  @Query()
  async posts() {
    return this.prisma.client.posts();
  }

  @ResolveProperty()
  async author(@Parent() { id }: Post) {
    return this.prisma.client.post({ id }).author();
  }

  @Mutation()
  @UseGuards(GqlAuthGuard)
  async createPost(
    @Args('postInput') { title, body }: PostInputDto,
    @GqlUser() user: User,
  ) {
    return this.prisma.client.createPost({
      title,
      body,
      author: { connect: { id: user.id } },
    });
  }
}
```

And don't forget to define everything in the module.

**src/post/post.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { PostResolver } from './post.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [PostResolver],
  imports: [PrismaModule],
})
export class PostModule {}
```

### User Module

Although we don't have any user mutations, we still need to define user resolvers so graphql can resolve our queries correctly.

```shell
$ nest g module user 
$ nest g resolver user
```

**src/user/user.resolver.ts**

```typescript
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
```

And of course `UserModule`.

**src/user/user.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [UserResolver],
  imports: [PrismaModule],
})
export class UserModule {}
```

# Sample Queries

To test your application you can run these simple queries.

**Signing-up**

```graphql
mutation {
  signup(signUpInput: { email: "user@email.com", password: "pasword" }) {
    id
    email
  }
}
```

**Logging-in**

```graphql
mutation {
  login(loginInput: { email: "user@email.com", password: "pasword" }) {
    id
    email
  }
}
```

**Creating a post**

```graphql
mutation {
  createPost(postInput: { title: "Post Title", body: "Post Body" }) {
    id
    title
    author {
      id
      email
    }
  }
}
```

**Retrieving all posts**

```graphql
query {
  posts {
    title
    author {
      email
    }
  }
}
```

# Conclusion

We are finally done with our app boilerplate! Check nestjs documentation to add more useful features to your application. When deploying to production environment don't forget to secure your Prisma layer and database.

You can find the final code [here](https://github.com/nikitakot/nestjs-boilerplate).
