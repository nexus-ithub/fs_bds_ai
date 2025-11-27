import { useEffect, useState } from 'react';

const VERSION_KEY = 'app_version';
const CHECK_INTERVAL = 10 * 1 * 1000; // 10분

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    const checkVersion = async (isInitialCheck = false) => {
      
      try {
        const timestamp = new Date().getTime();
        const res = await fetch(`/version.json?t=${timestamp}`, { cache: 'no-cache' });

        if (!res.ok) throw new Error('Version file load error');
        const data = await res.json();

        if (!data?.version) return;

        const current = localStorage.getItem(VERSION_KEY);

        if (!current) {
          localStorage.setItem(VERSION_KEY, data.version);
          return;
        }

        if (current !== data.version) {
          if (isInitialCheck) {
            localStorage.setItem(VERSION_KEY, data.version);
          } else {
            setUpdateAvailable(true);
          }
        }
      } catch (e) {
        console.error('❌ 에러:', e);
      }
    };

    checkVersion(true);
    const interval = setInterval(() => checkVersion(false), CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const refresh = async() => {
    fetch(`/version.json?t=${new Date().getTime()}`, { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        if (data?.version) {
          localStorage.setItem(VERSION_KEY, data.version);
        }
        window.location.reload();
      });
  };

  return { updateAvailable, setUpdateAvailable, refresh };
}