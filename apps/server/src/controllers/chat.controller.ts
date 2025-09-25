import axios from "axios";
import { Request, Response } from "express";
import { ChatModel } from "../models/chat.model";

export const askChat = async (req: Request, res: Response) => {
  const { question, userId, sessionId, titleExists } = req.body;
  const url = process.env.CHAT_URL;
  const apiKey = process.env.AICHAT_KEY;
  console.log(">>>question", question)
  console.log(">>>user_id", userId)
  console.log(">>>sessionId", sessionId)
  console.log(">>>titleExists", titleExists)

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
    user_id: userId,
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
  // return res.json(response.data);
}
