import { Router } from 'express';
import { askChat } from '../controllers/chat.controller';
import { getChatHistory } from '../controllers/chat.controller';
import { updateTitle } from '../controllers/chat.controller';
import { deleteChat } from '../controllers/chat.controller';

const router: Router = Router();

router.post('/ask', askChat);
router.get('/getChatHistory', getChatHistory);
router.put('/updateTitle', updateTitle);
router.put('/deleteChat', deleteChat);


export default router;