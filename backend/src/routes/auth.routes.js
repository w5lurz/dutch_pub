import { Router } from 'express';

import { checkDuplicateUsernameOrEmail } from '../middleware/verifySignUp';
import { addGuest, loginUser, logoutUser, signUp } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', [checkDuplicateUsernameOrEmail], signUp);

router.post('/login', loginUser);

router.post('/add-guest', addGuest);

router.post('/logout', logoutUser);

export default router;
