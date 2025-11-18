import useAxiosWithAuth from "../axiosWithAuth";
import { useNavigate } from "react-router-dom";
import {useQuery} from "react-query";
import { getAccessToken, setToken } from "../authutil";
import { QUERY_KEY_USER } from "../constants";
import { Header } from "../header";
import Main from "./Main";
import { Routes, Route, Navigate } from 'react-router-dom'
import { Support } from "./Support";
import { MyPage } from "./MyPage";
import { DotProgress } from "@repo/common";
import { DeleteAccount } from "./DeleteAccount";

export const Home = () => {

  const axiosInstance = useAxiosWithAuth();
  const navigate = useNavigate();
  const accessToken = getAccessToken();
  console.log("accessToken", accessToken);
  const {
    isLoading: checkingConfig,
    data: config,
  } = useQuery({
    queryKey: [QUERY_KEY_USER, accessToken],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/user/info");
      return response.data;
    },
    enabled: !!accessToken,
    onSuccess: (data) => {
      console.log("config onSuccess ", data);
    },
    onError: (error) => {
      console.error("config onError ", error);
      // navigate('/login')
    },
    refetchIntervalInBackground: false,
    retryOnMount: false,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: -1,
    refetchOnMount: false,
  });

  if (checkingConfig) {
    return <div className="w-full flex flex-col items-center justify-center overflow-auto h-screen">
      <DotProgress/>
    </div>;
  }  

  return (
    <div className="flex flex-col w-full h-screen">
      <Header user={config}/>
      <div className="min-h-0 flex-1 mt-[64px]">
        <Routes>
          <Route path={"/*"} element={<Navigate replace to={"/main"} />} />
          <Route path={'/main'} element={<Main />} />
          <Route path={'/support/*'} element={<Support />} />
          <Route path={'/delete-account'} element={<DeleteAccount />} />
          <Route path={'/myPage/*'} element={<MyPage />} />
        </Routes>                
      </div>
    </div>
  );
}

