import { Reflector } from '@nestjs/core';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  /**
   * 인증 가드를 구현한다.
   * @param context - 실행 컨텍스트
   * @returns boolean - 인증 여부
   */
  canActivate(context: ExecutionContext): boolean {
    // public 데코레이터가 설정된 경우, 인증을 건너뛴다.
    const isPublic = this.reflector.get<boolean>(Public, context.getHandler());

    if (isPublic) {
      return true;
    }

    // 요청에서 user 객체가 존재하는지 확인한다.
    const request = context.switchToHttp().getRequest();

    if (!request.user || request.user.type !== 'access') {
      return false;
    }

    return true;
  }
}
