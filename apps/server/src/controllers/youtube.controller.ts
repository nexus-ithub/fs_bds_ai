import { Request, Response } from 'express';
import fs from "fs";
import path from "path";
import { trackError } from '../utils/analytics';

export const getVideoList = async (req: Request, res: Response) => {
  const order = req.query.order as string

  try {
    // const filePath = path.join(__dirname, `../../youtube/${order}.json`);
    let filePath = path.join(__dirname, `../../youtube/${order}.json`);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, `../youtube/${order}.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: `${order}.json 파일이 없습니다.` });
      }
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    const result = JSON.parse(fileData);
    return res.json(result);
  } catch (error) {
    console.error(error);
    trackError(error, {
      message: '유튜브 리스트 조회 중 오류 발생',
      file: 'youtube.controller.ts',
      function: 'getVideoList',
      severity: 'error'
    })
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getBrandingVideo = async (req: Request, res: Response) => {
  try {
    // const filePath = path.join(__dirname, "../../youtube/branding.json");
    let filePath = path.join(__dirname, `../../youtube/branding.json`);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, `../youtube/branding.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: `branding.json 파일이 없습니다.` });
      }
    }
    const fileData = fs.readFileSync(filePath, "utf-8");
    const result = JSON.parse(fileData);
    return res.json(result);
  } catch (error) {
    console.error(error);
    trackError(error, {
      message: '유튜브 대표 영상 조회 중 오류 발생',
      file: 'youtube.controller.ts',
      function: 'getBrandingVideo',
      severity: 'error'
    })
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}
