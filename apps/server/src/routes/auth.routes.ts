import { Router } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);

export default router;
