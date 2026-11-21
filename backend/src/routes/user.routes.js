import { Router } from 'express';

import { allAccess, deleteMe, deletePushToken, setPushToken, userBoard } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/authJwt.js';
import { authLimits } from '../rateLimit.js';

const router = Router();

router.get('/all', [verifyToken], allAccess);

router.get('/user', [verifyToken], userBoard);

// Body `{ password }`: deletes the account (registered users).
router.delete('/me', [verifyToken, authLimits.deletePerAccount], deleteMe);

// Body `{ token }` (Expo push token): notifications on / off for this phone.
router.put('/me/push-token', [verifyToken], setPushToken);
router.delete('/me/push-token', deletePushToken);

export default router;
