import React, { useMemo } from 'react';
import animation from './animation.json';
import Lottie, { LottieRef } from "lottie-react";


interface CompleteProps {
  lottieRef?: LottieRef
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function Complete({ lottieRef, size = 'default', className = '' }: CompleteProps) {
  const sizeClass = {
    sm: 'w-[20px]',
    default: 'w-[40px]',
    lg: 'w-[80px]',
  }[size];
  const anim = useMemo(() => animation, [animation]); // prop이 자주 바뀌지 않게
  return (
    <Lottie 
      lottieRef={lottieRef} 
      className={`${sizeClass}`} 
      animationData={anim} 
      loop={false} 
      autoplay={false} />
  );
}
