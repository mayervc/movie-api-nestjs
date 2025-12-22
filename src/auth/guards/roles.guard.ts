import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Si no hay roles requeridos, permitir acceso (el endpoint no requiere roles específicos)
    if (!requiredRoles) {
      return true;
    }

    // Obtener el usuario autenticado de la request
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // Si no hay usuario autenticado, el JwtAuthGuard debería haber rechazado la petición
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Verificar si el usuario tiene uno de los roles requeridos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
