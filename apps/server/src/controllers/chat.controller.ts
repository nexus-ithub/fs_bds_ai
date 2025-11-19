import axios from "axios";
import { Request, Response } from "express";
import { ChatModel } from "../models/chat.model";
import { Sentry } from "../instrument";

export const askChat = async (req: Request, res: Response) => {
  console.log("여기 오지??")
  const { question, userId, sessionId, titleExists } = req.body;
  const url = process.env.CHAT_URL;
  const apiKey = process.env.AICHAT_KEY;
  console.log("question", question)
  console.log("userId", userId)
  console.log("sessionId", sessionId)
  console.log("titleExists", titleExists)
  console.log("url", url)
  console.log("apiKey", apiKey)

  let answerObj = { answer: "응답 지연으로 답변을 받을 수 없습니다.", summary_question: "제목 없음" };

  try{
    const response = await axios.post(
      url,
      { question: question, user_id: String(userId) },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    answerObj = JSON.parse(response.data.answer);

    await ChatModel.saveChat({
      session_id: sessionId,
      user_id: userId ?? null,
      title: titleExists ? null : answerObj.summary_question,
      question: question,
      answer: answerObj.answer ? answerObj.answer : "부동산 관련 질문 아니면 답할 수 없습니다.",
      score: response.data.avg_score,
    });

    return res.json({
      title: titleExists ? null : answerObj.summary_question,
      answer: answerObj.answer ? answerObj.answer : "부동산 관련 질문 아니면 답할 수 없습니다.",
      score: response.data.avg_score,
    }); 
  } catch (error) {
    Sentry.captureException(error);
    await ChatModel.saveChat({
      session_id: sessionId,
      user_id: userId ?? null,
      title: titleExists ? null : answerObj.summary_question,
      question: question,
      answer: "",
    });
    return res.status(500).json({ title: titleExists ? null : answerObj.summary_question, message: '서버 오류가 발생했습니다.' });
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
