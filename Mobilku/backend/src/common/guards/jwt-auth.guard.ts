import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    // Skip auth for webhook endpoints
    if (request.path.startsWith('/webhooks/')) {
      console.log(`🔓 [Auth] Skipping JWT validation for webhook: ${request.path}`);
      return true;
    }
    
    // Skip if marked as public with @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      console.log(`🔓 [Auth] Skipping JWT validation for public route: ${request.path}`);
      return true;
    }
    
    // Skip if marked as public on request object
    if ((request as any).isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}