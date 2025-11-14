import axios from "axios";
import { Request, Response } from "express";
import { ChatModel } from "../models/chat.model";
import { Sentry } from "../instrument";

export const askChat = async (req: Request, res: Response) => {
  const { question, userId, sessionId, titleExists } = req.body;
  const url = process.env.CHAT_URL;
  const apiKey = process.env.AICHAT_KEY;

  try{
    const response = await axios.post(
      url,
      { question: question, user_id: String(userId) },
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
      answer: response.data.answer ? response.data.answer : "부동산 관련 질문 아니면 답할 수 없습니다.",
    });

    if (user) {
      return res.json({
        title: titleExists ? null : response.data.summary_question,
        answer: response.data.answer ? response.data.answer : "부동산 관련 질문 아니면 답할 수 없습니다.",
      }); 
    } else {
      throw new Error('Error saving chat');
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getChatHistory = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const user = await ChatModel.getChatHistory(userId as unknown as number);
    if (user) {
      return res.json(user); 
    } else {
      throw new Error('Error getting chat history');
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const updateTitle = async (req: Request, res: Response) => {
  const { sessionId, title, userId } = req.body;
  try {
    const user = await ChatModel.updateTitle(sessionId, title, userId);
    if (user) {
      return res.json(user); 
    } else {
      throw new Error('Error updating title');
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const deleteChat = async (req: Request, res: Response) => {
  const { sessionId, userId } = req.body;
  try {
    const user = await ChatModel.deleteChat(sessionId, userId);
    if (user) {
      return res.json(user); 
    } else {
      throw new Error('Error deleting chat');
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
