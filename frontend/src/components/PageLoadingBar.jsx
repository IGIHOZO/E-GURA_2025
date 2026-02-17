import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PageLoadingBar = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(0);

    const t1 = setTimeout(() => setProgress(30), 50);
    const t2 = setTimeout(() => setProgress(60), 200);
    const t3 = setTimeout(() => setProgress(80), 400);
    const t4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setLoading(false), 200);
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 shadow-[0_0_10px_rgba(249,115,22,0.7)]"
        style={{
          width: `${progress}%`,
          transition: progress < 100
            ? 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'width 0.15s ease-out, opacity 0.3s ease-out 0.1s',
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
};

export default PageLoadingBar;
