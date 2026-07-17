import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../auth.constants';

/** Marque une route comme publique (contourne le JwtAuthGuard global). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
