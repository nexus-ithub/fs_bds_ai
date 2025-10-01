'use client';
import { useMemo } from 'react';
import animation from './animation.json';
import Lottie, { LottieRef } from "lottie-react";


interface CompleteProps {
  lottieRef?: LottieRef
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function DotProgress({ lottieRef, size = 'default', className = '' }: CompleteProps) {
  const sizeClass = {
    sm: 'w-[120px]',
    default: 'w-[240px]',
    lg: 'w-[300px]',
  }[size];
  const anim = useMemo(() => animation, [animation]); // prop이 자주 바뀌지 않게
  return (
    <Lottie 
      lottieRef={lottieRef} 
      className={`${sizeClass} ${className}`} 
      animationData={anim} 
      loop={true} 
      autoplay={true} />
  );
}
