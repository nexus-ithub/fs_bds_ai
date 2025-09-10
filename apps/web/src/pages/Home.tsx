import useAxiosWithAuth from "../../axiosWithAuth";
import { useNavigate } from "react-router-dom";
import {useQuery} from "react-query";
import { getAccessToken } from "../../authutil";
import { QUERY_KEY_USER } from "../../constants";
import { Header } from "../header";
import Main from "./Main";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

export const Home = () => {

  const axiosInstance = useAxiosWithAuth();
  const navigate = useNavigate();
  const {
    isLoading: checkingConfig,
    // data: config,
  } = useQuery({
    queryKey: [QUERY_KEY_USER, getAccessToken()],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/user/info");
      return response.data;
    },
    onSuccess: (data) => {
      console.log("config onSuccess ", data);
    },
    onError: (error) => {
      console.error("config onError ", error);
      navigate('/login')
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
      
    </div>;
  }  

  return (
    <div className="flex flex-col w-full h-screen bg-red-50">
      <Header />
      <div className="flex flex-grow">
        <Routes>
          <Route path={"/*"} element={<Navigate replace to={"/main"} />} />
          <Route path={'/main'} element={<Main />} />
        </Routes>                
      </div>
    </div>
  );
}

