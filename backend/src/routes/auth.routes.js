import { Router } from 'express';

import { checkDuplicateUsernameOrEmail } from '../middleware/verifySignUp.js';
import { addGuest, loginUser, signUp } from '../controllers/auth.controller.js';

const router = Router();

router.post('/signup', [checkDuplicateUsernameOrEmail], signUp);

router.post('/login', loginUser);

router.post('/add-guest', addGuest);


export default router;
