import { throwError } from 'rxjs'
import { catchError } from 'rxjs/operators'

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'

@Injectable()
export class DiscordErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      catchError((err) => {
        console.error('Erro capturado no Discord:', err)
        return throwError(() => err)
      }),
    )
  }
}
