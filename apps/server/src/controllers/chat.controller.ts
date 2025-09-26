import axios from "axios";
import { Request, Response } from "express";
import { ChatModel } from "../models/chat.model";

export const askChat = async (req: Request, res: Response) => {
  const { question, userId, sessionId, titleExists } = req.body;
  const url = process.env.CHAT_URL;
  const apiKey = process.env.AICHAT_KEY;

  const response = await axios.post(
    url,
    { question, userId },
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const user = await ChatModel.saveChat({
    session_id: sessionId,
    user_id: userId ?? null,
    title: titleExists ? null : response.data.summary_question,
    question: question,
    answer: response.data.answer,
  });

  if (user) {
    return res.json({
      title: titleExists ? null : response.data.summary_question,
      answer: response.data.answer,
    }); 
  } else {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getChatHistory = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const user = await ChatModel.getChatHistory(userId as unknown as number);
  if (user) {
    return res.json(user); 
  } else {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const updateTitle = async (req: Request, res: Response) => {
  const { sessionId, title, userId } = req.body;
  const user = await ChatModel.updateTitle(sessionId, title, userId);
  if (user) {
    return res.json(user); 
  } else {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const deleteChat = async (req: Request, res: Response) => {
  const { sessionId, userId } = req.body;
  const user = await ChatModel.deleteChat(sessionId, userId);
  if (user) {
    return res.json(user); 
  } else {
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
