<h1 align="center">
  <a href="https://github.com/nikitakot/nestjs-boilerplate"><img src="https://thepracticaldev.s3.amazonaws.com/i/whtmfhi1tmpsq1vgblhc.jpg" alt="NodeJS boilerplate" width=500"></a>
</h1>

## Description

Boilerplate application from this [tutorial](https://dev.to/nikitakot/building-nestjs-app-boilerplate-authentication-validation-graphql-and-prisma-f1d).

## Installation

```bash
$ npm install
$ docker-compose up -d
$ prisma deploy
```

## Running the app

```bash
# development
$ JWT_SECRET=secret npm run start

# watch mode
$ JWT_SECRET=secret npm run start:dev

# production mode
$ JWT_SECRET=secret npm run start:prod
```

## License

Nest is [MIT licensed](LICENSE).
