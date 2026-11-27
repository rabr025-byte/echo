import { useEffect, useRef, useState } from 'react';
import './PwaUpdate.css';

type Registration = ServiceWorkerRegistration | null;

export function PwaUpdate() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const registration = useRef<Registration>(null);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (!('serviceWorker' in navigator)) {
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }

    let cancelled = false;
    const register = async () => {
      try {
        const current = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (cancelled) return;
        registration.current = current;

        const markWaiting = () => {
          if (current.waiting) setUpdateReady(true);
        };
        markWaiting();
        current.addEventListener('updatefound', () => {
          const installing = current.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) markWaiting();
          });
        });
      } catch {
        if (!cancelled) setUpdateError(true);
      }
    };
    void register();

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const update = () => {
    const waiting = registration.current?.waiting;
    if (!waiting || offline || updating) return;
    setUpdating(true);
    setUpdateError(false);

    let reloaded = false;
    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    waiting.postMessage({ type: 'SKIP_WAITING' });
    window.setTimeout(() => {
      if (!reloaded) {
        setUpdating(false);
        setUpdateError(true);
      }
    }, 10000);
  };

  if (!offline && !updateReady && !updateError && !updating) return null;

  return (
    <aside className="pwa-update" aria-label="Echo App 狀態">
      {offline && <p role="status">離線中・仍可使用已載入的題庫。</p>}
      {(updateReady || updating) && (
        <button type="button" onClick={update} disabled={offline || updating}>
          {updating ? '更新中…' : offline ? '有新版本，連線後可更新' : '有新版本，點此更新'}
        </button>
      )}
      {updateError && <p role="status">更新暫時無法完成，請稍後再試。</p>}
    </aside>
  );
}

