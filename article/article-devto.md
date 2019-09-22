---
title: Building NestJS app boilerplate - Authentication, Validation, GraphQL and Prisma
published: false
description: 
tags: #nodejs
---

# Intro

NestJS is a relatively new framework in node world. Inspired by Angular and build on top of Express with full TypeScript support, it brings scalable and maintainable architecture to your applications. NestJS also supports GraphQL - robust query language for APIs with dedicated, ready to use `@nestjs/graphql` module (in fact, the module is just a wrapper around Apollo server).

In this tutorial we're going to build a boilerplate with all basic features you need to develop more complex apps. As a database layer we will use Prisma, since it works extremely well with GraphQL APIs.

# Getting Started

### NestJS

To start playing with NestJS you should have node (version >= 8.9.0) and npm installed. You can download and install it from official web or, for example, use nvm to manage different node versions on your machine as I do.

After you have node and npm installed, let's install NestJS CLI and initialise project with it.

```shell
$ npm i -g @nestjs/cli
$ nest new nestjs-boilerplate
```

During the installation process you will be asked what package manager you want to use (yarn or npm). In this tutorial I'll be using npm, but if you prefer yarn, go for it.

Now let's run `npm start`. It will start the application on port 3000, so opening `http://localhost:3000` in browser will display "Hello World!" message.

### GraphQL

As mentioned above, we will use `@nestjs/graphql` module to setup GraphQL for our API.

```shell
$ npm i --save @nestjs/graphql apollo-server-express graphql-tools graphql
```

After packages are installed, let's create configuration file for our GraphQL server.

```shell
$ touch src/graphql.options.ts
```

The configuration will be passed to underlying Appolo instance by NestJS. Configuration documentation can be found [here](https://www.apollographql.com/docs/apollo-server/api/apollo-server/).

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

Then register `GraphQLModule` and pass configuration in application's main `AppModule` module.

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

You may notice I removed `AppController` and `AppService` from main module. We don't need them since we will be using GraphQL instead of REST. Appropriate files can be deleted too.

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

Running `npm start` will generate `src/graphql.schema.generated.ts` with typescript types from schema, that we can use in our source code, and launch the server on port 3000. We can now navigate to `http://localhost:3000/graphql` (default GraphQL API path) to see GraphQL Playground.

<img src="https://thepracticaldev.s3.amazonaws.com/i/gccnoc11iw8fv6gvnld2.png" alt="graphql playground" width="542"/>

### Prisma

To run Prisma we need to install [Docker](https://www.docker.com/), follow the installation guide [here](https://docs.docker.com/install/). *Linux users - you need to install [docker-compose](https://docs.docker.com/compose/install/) separately*.  We will be running two containers - one for actual database and second one for prisma service.

Create a docker compose configuration file in root project directory.

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

Prisma server is now connected to local Postgress instance and runs on port 4466. Opening `http://localhost:4466` in a browser will open Prisma GraphQL playground.

Now let's install Prisma CLI and prisma client helper library. 

```shell
$ npm install -g prisma 
$ npm install --save prisma-client-lib
```

And initialise Prisma in our project root folder.

```shell
$ prisma init --endpoint http://localhost:4466
```

Prisma initialisation will create `datamodel.prisma` and `prisma.yml` files in the root of our project. `datamodel.prisma` contains database schema and `prisma.yml` prisma client configurations.

Add the following code to `prisma.yml` to generate `typescript-client` so we can query our database.

**prisma.yml**
```yml
endpoint: http://localhost:4466
datamodel: datamodel.prisma
generate:
  - generator: typescript-client
    output: ./generated/prisma-client/
```

Then run `prisma deploy` to deploy your service. It will initialise schema specified in `datamodel.prisma` and generate prisma client.

```shell
$ prisma deploy
```

Go to `http://localhost:4466/_admin` to open prisma admin tool, a little more convenient way to view and edit your data comparing to graphql playground.

### Prisma Module

This step is pretty much optional because you can use generated prisma client as it is in other modules/services etc. But making a prisma module will make it easier to configure or change something in the future.

With NestJS CLI lets create prisma module and service. CLI will automatically create files boilerplate and do initial module metadata setup for us.

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
export class PrismaService extends Prisma {}
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

# Authentication

### Database schema

Let's create a new folder where we will store all our database schema files and create a file where we will define user entity.

```shell
$ mkdir database
$ touch database/user.prisma
```

And put the following schema there:

**database/user.prisma**

```graphql
type User {
    id: ID! @id
    email: String! @unique
    password: String!
    createdAt: DateTime! @createdAt
    updatedAt: DateTime! @updatedAt
}
```

Then let's modify **prisma.yml** and define path to our new schema. You may notice I've also added *post-deploy* hook to the file, it's optional and will just simply generate prisma client for us after the deploy so you don't need to do it manually.

**prisma.yml**

```yml
endpoint: http://localhost:4466
datamodel:
  - database/user.prisma
generate:
  - generator: typescript-client
    output: ./generated/prisma-client/
hooks:
  post-deploy:
    - prisma generate
```


After deploying the schema you should see appropriate changes in prisma admin `http://localhost:4466/_admin`.

```ssh
$ prisma deploy
```

### API schema

Let's put the following graphql API schema in **src/schema/gql-api.graphql**.

**src/schema/gql-api.graphql**

```graphql
input SignUpInput {
  email: String!
  password: String!
}

input LoginInput {
  email: String!
  password: String!
}

type Mutation {
  signup(signUpInput: SignUpInput): AuthPayload!
  login(loginInput: LoginInput): AuthPayload!
}

type AuthPayload {
  id: ID!
  email: String!
}
```

Now launch the app with `npm start` so it will generate typescript types from the schema above.

### Auth Module

First, we need to install some additional packages to implement passport JWT in our NestJS app.

```shell
$ npm install --save @nestjs/passport passport @nestjs/jwt passport-jwt
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
















### User Module

Create user module, user service and user resolver with NestJS CLI:

```shell
$ nest g module user 
$ nest g service user
$ nest g resolver user
```

Import `PrismaModule` to `UserModule`.

**src/user/user.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [UserService, UserResolver],
  imports: [PrismaModule],
})
export class UserModule {}
```









