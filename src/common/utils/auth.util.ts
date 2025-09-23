import { UnauthorizedException } from '@nestjs/common';
import { RequestWithUser } from 'src/types/request';

export function assertAuthenticated(req: RequestWithUser) {
    if (!req.user?.sub) {
        throw new UnauthorizedException('인증이 필요합니다.');
    }

    return req.user.sub;
}
