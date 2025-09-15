import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def branding_video(file_path):
  try:
    branding_url = f"{os.getenv('YOUTUBE_CHANNEL_URL')}?part=brandingSettings&id={os.getenv('YOUTUBE_CHANNEL_ID')}&key={os.getenv('YOUTUBE_API_KEY')}"
    branding_info = requests.get(branding_url).json()
    video_id = branding_info["items"][0]["brandingSettings"]["channel"]["unsubscribedTrailer"]

    video_url = f"{os.getenv('YOUTUBE_VIDEO_URL')}?part=snippet,statistics&id={video_id}&key={os.getenv('YOUTUBE_API_KEY')}"
    video_info = requests.get(video_url).json()

    item = video_info["items"][0]
    result = {
      "videoId": item["id"],
      "title": item["snippet"]["title"],
      "thumbnail": item["snippet"]["thumbnails"]["standard"]["url"],
      "publishedAt": item["snippet"]["publishedAt"],
      "viewCount": int(item["statistics"]["viewCount"])
    }

    with open(file_path, "w", encoding="utf-8") as f:
      json.dump(result, f, ensure_ascii=False, indent=2)

  except Exception as e:
    print("서버 오류:", e)

def video_orderby(file_path, order):
  try:
    view_counts_url = f"{os.getenv('YOUTUBE_SEARCH_URL')}?part=snippet&channelId={os.getenv('YOUTUBE_CHANNEL_ID')}&maxResults=50&order={order}&type=video&regionCode=KR&key={os.getenv('YOUTUBE_API_KEY')}"
    view_counts_info = requests.get(view_counts_url).json()
    video_ids = [item["id"]["videoId"] for item in view_counts_info.get("items", [])]
    if video_ids:
      ids_str = ",".join(video_ids)
      video_info_url = f"{os.getenv('YOUTUBE_VIDEO_URL')}?part=snippet,statistics,contentDetails&id={ids_str}&key={os.getenv('YOUTUBE_API_KEY')}"
      video_info_data = requests.get(video_info_url).json()

    videos = []
    for item in video_info_data.get("items", []):
      videos.append({
        "videoId": item["id"],
        "title": item["snippet"]["title"],
        "thumbnail": item["snippet"]["thumbnails"]["standard"]["url"],
        "publishedAt": item["snippet"]["publishedAt"],
        "viewCount": int(item["statistics"]["viewCount"]),
        "duration": item["contentDetails"]["duration"]
      })
    
    with open(file_path, "w", encoding="utf-8") as f:
      json.dump(videos, f, ensure_ascii=False, indent=2)
  except Exception as e:
    print("서버 오류:", e)

# 스크립트 실행
if __name__ == "__main__":
  base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
  branding_video(os.path.join(base_dir, "apps", "server", "youtube", "branding.json"))
  video_orderby(os.path.join(base_dir, "apps", "server", "youtube", "viewCount.json"), "viewCount")
  video_orderby(os.path.join(base_dir, "apps", "server", "youtube", "date.json"), "date")
  video_orderby(os.path.join(base_dir, "apps", "server", "youtube", "rating.json"), "rating")