import { Router } from 'express';
import { createUser, login, refresh, logout, oauth, oAuthCallback } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/signup', createUser);
router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);
router.post('/oauth', oauth);
router.post('/oauth/callback/:provider', oAuthCallback);

export default router;
