import { Controller, Post, Headers, Body, Request, Res } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { Response } from 'express';

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
  async loginUser(
    @Headers('authorization') token: string,
    @Res() res: Response,
  ) {
    const { refreshToken, accessToken } = await this.authService.login(token);
    // ✅ refreshToken을 HttpOnly 쿠키로 설정
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS에서만 전송 (운영 환경에서는 필수!)
      sameSite: 'strict', // CSRF 방어
      maxAge: 1000 * 60 * 60 * 24, // 1일
    });

    // ✅ accessToken은 JSON 응답으로 클라이언트에 전달
    res.json({ accessToken });
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }
}
