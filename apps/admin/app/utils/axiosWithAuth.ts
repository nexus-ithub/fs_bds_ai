"use client";

import axios from "axios";
import { signOut, getSession } from "next-auth/react";

const useAxiosWithAuth = () => {
  const axiosInstance = axios.create({
    baseURL: "/api/bff/admin",
    withCredentials: true,
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      // 최신 세션 가져오기
      const currentSession = await getSession();
      
      // 세션 에러 체크
      if (currentSession?.error === "RefreshAccessTokenError") {
        signOut();
        return Promise.reject(new Error("Session expired"));
      }
      
      if (currentSession?.accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${currentSession.accessToken}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config as any;
      const status = error.response?.status;

      if (status === 401 && !original?._retry) {
        original._retry = true;
        
        // 세션 갱신 시도
        const refreshed = await getSession();
        
        // 세션 에러 체크
        if (refreshed?.error === "RefreshAccessTokenError") {
          signOut();
          return Promise.reject(new Error("Session expired"));
        }
        
        // 갱신 성공하면 재시도
        if (refreshed?.accessToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
          return axiosInstance.request(original);
        }
        
        // 갱신 실패
        signOut();
        return Promise.reject(new Error("Session refresh failed"));
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxiosWithAuth;