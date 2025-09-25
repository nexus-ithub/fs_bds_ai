import { Router } from 'express';
import { askChat } from '../controllers/chat.controller';
import { getChatHistory } from '../controllers/chat.controller';

const router: Router = Router();

router.post('/ask', askChat);
router.get('/getChatHistory', getChatHistory);


export default router;