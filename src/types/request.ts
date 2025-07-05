import { User } from 'src/user/entity/user.entity';

export interface RequestWithUser extends Request {
  user?: { sub: number; role: string; type: string; iat: number; exp: number };
}
