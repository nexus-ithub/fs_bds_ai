import {useNavigate} from "react-router-dom";
import axios from "axios";
import {getAccessToken, getRefreshToken, setToken, logout} from "./authutil";
import { API_HOST } from "./constants";
import { trackError } from "./utils/analytics";

// console.log(API_HOST)
const useAxiosWithAuth = () => {
  const navigate = useNavigate();
  const axiosInstance = axios.create({
    baseURL: API_HOST,
    withCredentials: true,
    // headers: {
    //   authorization: `Bearer ${accessToken}`,
    // },
  });
  axiosInstance.defaults.headers.authorization = `Bearer ${getAccessToken()}`;

  axiosInstance.interceptors.response.use(
    (response) => {
      return response; // 이후 요청은 정상 응답
    },
    async (error) => {
      const originalRequest = error.config || {};
      const statusCode = error.response?.status;

      // console.log('TEST statusCode ', statusCode)
      if (statusCode === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshResp = await axios.post(`${API_HOST}/api/auth/refresh-token`, {
            keepLoggedIn : localStorage.getItem("autoLogin") === "true",
          }, {
            withCredentials: true,
          });

          if (refreshResp.data) {
            const { accessToken: newAccessToken } = refreshResp.data;
            console.log('new access token:', newAccessToken);
            setToken(newAccessToken);
            originalRequest.headers.authorization = `Bearer ${newAccessToken}`;
            axiosInstance.defaults.headers.authorization = `Bearer ${newAccessToken}`;

            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // setToken(null);
          logout();
          navigate('/');
          // navigate('/login');
        }
        return Promise.reject(error);
      }else if(statusCode === 403){
        // navigate('/login');
        logout();
        navigate('/');
        return Promise.reject(error);
      }
      if (statusCode && statusCode >= 400 && statusCode !== 404) {
        trackError(error, {
          message: 'Web interceptor 오류 발생',
          file: 'axiosWithAuth.tsx',
          page: window.location.pathname,
          severity: 'error'
        })
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxiosWithAuth;