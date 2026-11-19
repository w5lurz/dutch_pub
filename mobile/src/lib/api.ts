import { createApi } from '@dutch-pub/shared';

import { API_URL } from './config';
import { getValidToken } from './session';

/** REST client; sends the access token as `Authorization: Bearer <token>` (refreshed first when it is about to expire). */
export const api = createApi(API_URL, { getToken: getValidToken });
