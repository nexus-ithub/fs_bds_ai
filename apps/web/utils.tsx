
import type { LatLng, Coords } from "@repo/common";
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from "date-fns";



export function convertXYtoLatLng(data: Coords[] | Coords[][]): LatLng[] | LatLng[][] {
  if (Array.isArray(data[0])) {
    // XY[][] → LatLng[][]
    return (data as Coords[][]).map(ring =>
      ring.map(p => ({ lat: p.y, lng: p.x }))
    )
  } else {
    // XY[] → LatLng[]
    return (data as Coords[]).map(p => ({ lat: p.y, lng: p.x }))
  }
}


export function formatTimeAgo(date: Date) {
  const now = new Date();

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return "방금 전";

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}시간 전`;

  const days = differenceInDays(now, date);
  if (days < 7) return `${days}일 전`;

  const weeks = differenceInWeeks(now, date);
  if (weeks < 5) return `${weeks}주 전`;

  const months = differenceInMonths(now, date);
  if (months < 12) return `${months}개월 전`;

  const years = differenceInYears(now, date);
  return `${years}년 전`;
}

export function formatDuration(isoDuration: string) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

