import { createApi } from '@dutch-pub/shared';
import { baseUrl } from '../utils/config';

export const { registration, loginUser, logoutUser, getUser, addGuest, getLeaderBoard } = createApi(baseUrl ?? '');
