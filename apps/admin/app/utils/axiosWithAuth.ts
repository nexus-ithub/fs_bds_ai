"use client";

import axios from "axios";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const useAxiosWithAuth = () => {
  const router = useRouter();

  const axiosInstance = axios.create({
    baseURL: "/api/bff/admin",
  });

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401) {
        await signOut({ redirect: false });
        router.push("/login");
      }

      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxiosWithAuth;