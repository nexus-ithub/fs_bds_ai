import { useState, useRef } from 'react';
import { useQuery } from 'react-query';

const VERSION_KEY = 'app_version';

interface VersionData {
  version: string;
}

const fetchVersion = async (): Promise<VersionData> => {
  const timestamp = new Date().getTime();
  const res = await fetch(`/version.json?t=${timestamp}`, { cache: 'no-cache' });

  if (!res.ok) throw new Error('Version file load error');
  const data = await res.json();

  if (!data?.version) throw new Error('Invalid version data');

  return data;
};

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  useQuery<VersionData>('appVersion', fetchVersion, {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    onSuccess: (data) => {
      const current = localStorage.getItem(VERSION_KEY);

      if (!current) {
        localStorage.setItem(VERSION_KEY, data.version);
        isInitialMount.current = false;
        return;
      }

      if (current !== data.version) {
        if (isInitialMount.current) {
          localStorage.setItem(VERSION_KEY, data.version);
          isInitialMount.current = false;
        } else {
          setUpdateAvailable(true);
        }
      } else {
        isInitialMount.current = false;
      }
    },
  });

  const refresh = () => {
    const timestamp = new Date().getTime();
    fetch(`/version.json?t=${timestamp}`, { cache: 'no-cache' })
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