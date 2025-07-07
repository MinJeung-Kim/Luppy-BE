import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/user/entity/user.entity';
import { RBAC } from '../decorator/rbac.decorator';
/*
  * RBAC 가드 구현
   이 가드는 사용자의 역할에 따라 접근을 제어합니다.
   */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Role>(RBAC, context.getHandler());

    if (!Object.values(Role).includes(role)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // authGuard가 user를 설정하지 않은 경우
    if (!user) {
      return false;
    }

    return user.role <= role;
  }
}
