import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICurrentUser } from '../types';

export const CurrentUser = createParamDecorator(
  (
    data: keyof ICurrentUser | undefined,
    ctx: ExecutionContext,
  ): ICurrentUser | string => {
    const request = ctx.switchToHttp().getRequest<{ user: ICurrentUser }>();
    const user = request.user;

    if (data) {
      return user[data];
    }

    return user;
  },
);

export { ICurrentUser };
