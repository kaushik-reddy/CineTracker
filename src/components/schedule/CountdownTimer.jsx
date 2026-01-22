import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ targetDate, audioFormat, videoFormat }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      
      if (difference <= 0) {
        setTimeLeft('Now!');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}hr`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}hr ${minutes}min ${seconds}sec`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}min ${seconds}sec`);
      } else {
        setTimeLeft(`${seconds}sec`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const getFormatText = () => {
    // Prioritize premium formats
    if (videoFormat === 'IMAX' || videoFormat === 'IMAX Enhanced') {
      return ` in ${videoFormat}`;
    } else if (audioFormat === 'Dolby Atmos') {
      return ' in Dolby Atmos';
    } else if (audioFormat === 'IMAX Enhanced Audio') {
      return ' in IMAX Enhanced Audio';
    } else if (videoFormat === 'Dolby Vision') {
      return ' in Dolby Vision';
    } else if (videoFormat && videoFormat !== 'HD' && videoFormat !== 'SD') {
      return ` in ${videoFormat}`;
    } else if (audioFormat && audioFormat !== 'Stereo') {
      return ` in ${audioFormat}`;
    }
    return '';
  };

  return (
    <div className="flex items-center gap-1 text-amber-400 font-medium whitespace-nowrap text-xs">
      <Clock className="w-3 h-3" />
      <span>{timeLeft}{getFormatText()}</span>
    </div>
  );
}