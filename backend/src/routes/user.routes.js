import { Router } from 'express';

import { allAccess, userBoard } from '../controllers/user.controller';
import { verifyToken } from '../middleware/authJwt';

const router = Router();

router.get('/all', allAccess);

router.get('/user', [verifyToken], userBoard);

/**
 *
 * router.patch("/:id", updateTodo);
 * router.delete("/:id", deleteTodo);
 */

export default router;
