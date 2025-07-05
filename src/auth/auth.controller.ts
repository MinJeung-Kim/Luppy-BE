import { Controller, Post, Headers, Body, Request } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  registerUser(
    // token => Basic $token
    @Headers('authorization') token: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.authService.register(token, createUserDto);
  }

  @Public()
  @Post('/login')
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }
}
