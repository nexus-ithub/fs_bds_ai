import { Router } from 'express';
import { askChat } from '../controllers/chat.controller';

const router: Router = Router();

router.post('/ask', askChat);


export default router;