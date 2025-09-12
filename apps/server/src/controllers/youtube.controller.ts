import { Request, Response } from 'express';

export const getVideoList = async (req: Request, res: Response) => {
  console.log("이거도 안오는거잖아 지금..")
  const order = req.params.order;
  console.log("order", order);

  try {
    const result = await fetch(
      `${process.env.YOUTUBE_SEARCH_URL}?part=snippet&channelId=${process.env.YOUTUBE_CHANNEL_ID}&maxResults=10&order=${order}&type=video&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await result.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
