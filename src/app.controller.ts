import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('livecheck')
  alive(): string {
    return 'alive!';
  }
}
