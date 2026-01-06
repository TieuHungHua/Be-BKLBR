import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface CurrentUserType {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatar: string | null;
  classMajor: string | null;
}

interface RequestWithUser {
  user?: CurrentUserType;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new Error(
        'User not found in request. Make sure JwtAuthGuard is applied.',
      );
    }

    return request.user;
  },
);
