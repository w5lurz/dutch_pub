import { Router } from 'express';

import { all, leaderBoard } from '../controllers/played_game.controller';

const router = Router();

router.get('/all', all);
router.get('/leaderboard', leaderBoard);

export default router;
