import { createApi } from '@dutch-pub/shared';

import { getToken } from './authToken';
import { API_URL } from './config';

/** REST client; sends the stored token as `Authorization: Bearer <token>`. */
export const api = createApi(API_URL, { getToken });
