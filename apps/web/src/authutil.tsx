
// export function setToken(refreshToken : string | null, accessToken : string | null) {
//   const authData = { accessToken, refreshToken };
//   const autoLogin = localStorage.getItem("autoLogin");
//   if(autoLogin === null || autoLogin === 'true'){
//     localStorage.setItem("auth", JSON.stringify(authData));
//     sessionStorage.removeItem("auth")
//   }else{
//     sessionStorage.setItem("auth", JSON.stringify(authData));
//     localStorage.removeItem("auth")
//   }

// }
export function setToken(accessToken : string | null) {
  const authData = { accessToken };
  const autoLogin = localStorage.getItem("autoLogin");
  if(autoLogin === null || autoLogin === 'true'){
    localStorage.setItem("auth", JSON.stringify(authData));
    sessionStorage.removeItem("auth")
  }else{
    sessionStorage.setItem("auth", JSON.stringify(authData));
    localStorage.removeItem("auth")
  }

}

export function getToken() {
  if (typeof window !== "undefined") {
    const authData = localStorage.getItem("auth") || sessionStorage.getItem("auth");
    return authData ? JSON.parse(authData) : { accessToken: null };
  }
  // const authData = localStorage.getItem("auth") || sessionStorage.getItem("auth");
  // return authData ? JSON.parse(authData) : { accessToken: null, refreshToken: null };
}

// export function getToken() {
//   if (typeof window !== "undefined") {
//     const authData = localStorage.getItem("auth") || sessionStorage.getItem("auth");
//     return authData ? JSON.parse(authData) : { accessToken: null, refreshToken: null };
//   }
//   // const authData = localStorage.getItem("auth") || sessionStorage.getItem("auth");
//   // return authData ? JSON.parse(authData) : { accessToken: null, refreshToken: null };
// }

export function saveAutoLogin(autoLogin : string) {
  localStorage.setItem("autoLogin", autoLogin);
}

export const getAccessToken = () => {
  const { accessToken } = getToken();
  return accessToken;
}

export const getRefreshToken = () => {
  const { refreshToken } = getToken();
  return refreshToken;
}

export const logout = () => {
  localStorage.removeItem("auth");
  sessionStorage.removeItem("auth");
  localStorage.removeItem("autoLogin");
  localStorage.removeItem("holidays");
  return Promise.resolve();
};