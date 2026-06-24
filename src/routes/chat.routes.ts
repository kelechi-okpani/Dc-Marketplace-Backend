import { Router } from 'express';
import { startConversation, getConversations, getMessages, sendMessage, blockConversation } from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/conversations', protect, startConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.put('/conversations/:id/block', protect, blockConversation);

export default router;