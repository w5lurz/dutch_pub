import { Router } from 'express';

import { checkDuplicateUsernameOrEmail } from '../middleware/verifySignUp';
import { loginUser, logoutUser, signUp } from '../controllers/auth.controller';

const router = Router();

router.post('/signup', [checkDuplicateUsernameOrEmail], signUp);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

export default router;
