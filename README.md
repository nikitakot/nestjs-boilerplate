<h1 align="center">
  <a href="https://github.com/nikitakot/nestjs-boilerplate"><img src="https://thepracticaldev.s3.amazonaws.com/i/whtmfhi1tmpsq1vgblhc.jpg" alt="NodeJS boilerplate" width=500"></a>
</h1>

## Description

Boilerplate application from this [tutorial](https://dev.to/nikitakot/nestjs-boilerplate-with-prisma-5d25-temp-slug-3438209?preview=83828ea41d7dec833140528878644ec8ee72956162768602883552429fa21d55fcedef6f03ae5944861b370057d0cceee291957350c415530588ab34).

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
