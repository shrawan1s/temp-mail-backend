import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICurrentUserData } from '../interfaces';

export const CurrentUser = createParamDecorator(
    (data: keyof ICurrentUserData | undefined, ctx: ExecutionContext): ICurrentUserData | string => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as ICurrentUserData;

        if (data) {
            return user[data];
        }

        return user;
    },
);
