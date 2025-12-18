import { Router } from 'express';
import { createUser, login, refresh, logout, oauth, oAuthCallback, findAccount, pwFind, verifyResetToken, InitVerification, VerificationCallback } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/signup', createUser);
router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);
router.post('/find-account', findAccount);
router.post('/pwfind', pwFind);
router.get('/verify-reset-token', verifyResetToken);
router.post('/oauth', oauth);
router.post('/oauth/callback/:provider', oAuthCallback);
router.get('/init-verification', InitVerification);
router.post('/verify-identity/callback', VerificationCallback);

export default router;
