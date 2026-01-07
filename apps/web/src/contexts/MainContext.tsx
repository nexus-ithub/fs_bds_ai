import { createContext, useContext } from 'react';

interface MainContextValue {
  resetMainView: () => void;
}

const MainContext = createContext<MainContextValue | null>(null);

export const useMainContext = () => {
  const context = useContext(MainContext);
  // Main 외부(다른 라우트)에서도 사용되므로 null 반환 허용
  return context;
};

export default MainContext;
