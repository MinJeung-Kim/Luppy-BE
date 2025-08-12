import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from 'src/user/entity/user.entity';
import { envVariables } from 'src/common/const/env.const';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) { }

  // rawToken => Basic $token
  parseBasicToken(rawToken: string) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new BadRequestException('토큰이 제공되지 않았습니다!');
    }

    // 1. 토큰을 띄어쓰기(' ') 기준으로 스플릿 한 후 토큰 값만 추출
    // email:password
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    // 2. 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    // [email, password]
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [email, password] = tokenSplit;

    return { email, password };
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    try {
      // verify =>  token 검증
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVariables.refreshTokenSecret
            : envVariables.accessTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('Refresh 토큰을 입력해주세요!');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('Access 토큰을 입력해주세요!');
        }
      }
      return payload;
    } catch (error) {
      console.log(error);

      throw new UnauthorizedException('토큰이 만료 됐습니다.');
    }
  }

  async register(rawToken: string, createUserDto: CreateUserDto) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다');
    }

    const hashRounds =
      this.configService.get<number>(envVariables.hashRounds) || 10;
    const hash = await bcrypt.hash(password, hashRounds);

    await this.userRepository.save({
      email,
      password: hash,
      ...createUserDto,
    });

    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  async issueToken(id: number, role: Role, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariables.refreshTokenSecret,
    );
    const accessTokenSecret = this.configService.get<string>(
      envVariables.accessTokenSecret,
    );

    const payload: Record<string, any> = {
      sub: id,
      role,
      type: isRefreshToken ? 'refresh' : 'access',
    };
    // 
    return this.jwtService.signAsync(payload, {
      secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
      // expiresIn: isRefreshToken ? '24h' : '5m',
      expiresIn: isRefreshToken ? '24h' : '24h', // 배포 전에 시간 바꾸기
    });
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const { id, role } = await this.authenticate(email, password);
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    return {
      refreshToken: await this.issueToken(id, role, true),
      accessToken: await this.issueToken(id, role, false),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        profile: user.profile,
      }
    };
  }
}
