"use client";

import axios from "axios";
import { signOut, getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const useAxiosWithAuth = () => {
  const router = useRouter();
  console.log("🟢 useAxiosWithAuth 훅이 호출됨");

  const axiosInstance = axios.create({
    baseURL: "/api/bff/admin",
    withCredentials: true,
  });

  const { data: session } = useSession();

  // ✅ 요청 인터셉터 (동기): useSession 값 사용해 레이스 줄이기
  axiosInstance.interceptors.request.use((config) => {
    console.log("➡️ 요청 보냄:", config.url);
    console.log("session (from hook):", session);

    if (session?.accessToken) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${session.accessToken}`;
      console.log("🔑 Authorization 추가됨", session.accessToken);
    } else {
      console.warn("⚠️ 세션 또는 accessToken 없음 (hook)");
    }

    return config;
  });

  // ✅ 응답 인터셉터: 401 한 번만 자동 재시도
  axiosInstance.interceptors.response.use(
    (res) => {
      console.log("✅ 응답 성공:", res.config.url, res.status);
      return res;
    },
    async (error) => {
      const original = error.config as any;
      console.log(
        "❌ 응답 실패:",
        original?.url || original, error.response?.status, error.response?.data?.message
      );
      const status = error.response?.status;

      if (status === 401 && !original?._retry) {
        try {
          original._retry = true;
          const refreshed = await getSession();
          if (refreshed?.accessToken) {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
            return axiosInstance.request(original);
          }
        } catch (e) {
          await signOut();
        }
        console.log("재시도 불가 — 로그아웃 처리");
        await signOut();
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxiosWithAuth;
