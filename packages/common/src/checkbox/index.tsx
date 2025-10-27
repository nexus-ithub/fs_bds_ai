'use client';
import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  labelOrderLast?: boolean;
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  labelClassName = '',
  labelOrderLast = false
}: CheckboxProps) => {
  return (
    <label 
      onClick={(e: React.MouseEvent<HTMLLabelElement>) => {
        e.stopPropagation();
        onChange(!checked)
      }} 
      className={`flex items-center gap-[8px] cursor-pointer select-none ${disabled ? 'opacity-80 pointer-events-none' : ''} ${className}`}
    >
      <div className="w-[16px] h-[16px] bg-white">
          {
            checked ? 
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="20" rx="2" fill="#4E52FF"/>
              <path d="M14.0741 6.23275C14.4211 5.92167 14.9526 5.91985 15.3025 6.24276C15.652 6.56566 15.6963 7.09877 15.4188 7.4737L15.3582 7.54681L9.75644 13.7005C9.58034 13.8937 9.33062 14.003 9.07015 13.9999C8.80966 13.9968 8.56237 13.8819 8.39082 13.6844L4.82608 9.582L4.76839 9.50789C4.49923 9.12646 4.55539 8.59371 4.91261 8.27896C5.26974 7.96442 5.80131 7.979 6.14097 8.29799L6.20662 8.3661L9.097 11.6923L14.0075 6.29885L14.0741 6.23275Z" fill="white"/>
            </svg>
              :
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" fill="white"/>
              <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" stroke="#DCDEE2"/>
              <path d="M14.0741 6.23275C14.4211 5.92167 14.9526 5.91985 15.3025 6.24276C15.652 6.56566 15.6963 7.09877 15.4188 7.4737L15.3582 7.54681L9.75644 13.7005C9.58034 13.8937 9.33062 14.003 9.07015 13.9999C8.80966 13.9968 8.56237 13.8819 8.39082 13.6844L4.82608 9.582L4.76839 9.50789C4.49923 9.12646 4.55539 8.59371 4.91261 8.27896C5.26974 7.96442 5.80131 7.979 6.14097 8.29799L6.20662 8.3661L9.097 11.6923L14.0075 6.29885L14.0741 6.23275Z" fill="#DCDEE2"/>
            </svg>
          }
      </div>
      {label && <span className={`leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${labelOrderLast ? 'order-last' : 'order-first'} ${labelClassName ? labelClassName : 'font-s2 text-text-02'}`}>{label}</span>}
    </label>
  );
};

export default Checkbox;
