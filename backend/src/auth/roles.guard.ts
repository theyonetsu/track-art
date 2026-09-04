import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

/** Réservé au super-administrateur de la plateforme. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenException('Réservé à l\'administration de la plateforme');
    return true;
  }
}
