import { Router } from 'express';
import { login, refresh, logout, oauth } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);
router.post('/oauth', oauth);

export default router;
