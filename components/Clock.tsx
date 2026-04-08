'use client';

import { useState, useEffect } from 'react';

export const Clock = () => {
  const [time, setTime] = useState(() => '-');

  const updateTime = () => {
    setTime(new Date().toLocaleTimeString("en-US"));
  };

  useEffect(() => {
    const intervalID = setInterval(() => updateTime(), 1000);

    return () => {
      clearInterval(intervalID);
    };
  }, []);

  return <span>{time}</span>;
}