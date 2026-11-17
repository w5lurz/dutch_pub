import { Router } from 'express';

import { checkDuplicateUsernameOrEmail } from '../middleware/verifySignUp.js';
import { addGuest, loginUser, signUp } from '../controllers/auth.controller.js';
import { setMyAvatar } from '../controllers/avatar.controller.js';
import { verifyToken } from '../middleware/authJwt.js';

const router = Router();

router.post('/signup', [checkDuplicateUsernameOrEmail], signUp);

router.post('/login', loginUser);

router.post('/add-guest', addGuest);

// Body `{ avatar: <id from AVATAR_IDS> | null }`; logged-in (non-guest) users only.
router.put('/me/avatar', [verifyToken], setMyAvatar);
router.patch('/me/avatar', [verifyToken], setMyAvatar);

export default router;
