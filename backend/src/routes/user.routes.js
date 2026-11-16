import { Router } from 'express';

import { allAccess, userBoard } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/authJwt.js';

const router = Router();

router.get('/all', [verifyToken], allAccess);

router.get('/user', [verifyToken], userBoard);

/**
 *
 * router.patch("/:id", updateTodo);
 * router.delete("/:id", deleteTodo);
 */

export default router;
