'use client';
import { useRef } from "react";
import { SearchIcon, CloseIcon } from "../icons";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  showPrefix?: boolean;
  prefixSize?: number;
  prefixColor?: string;
  disabled?: boolean;
  prefixIcon?: React.ReactNode;
  // suffixIcon?: React.ReactNode;
  showClearButton?: boolean;
  variant?: "default" | "roundedOutline" | "filled";
  className?: string;
  inputClassName?: string;
};

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  placeholder = "검색어를 입력해 주세요.",
  showPrefix = true,
  prefixSize = 16,
  prefixColor = "var(--gray-050)",
  disabled = false,
  prefixIcon,
  // suffixIcon,
  showClearButton = false,
  variant = "default",
  className = "",
  inputClassName = "",
}: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const variantClasses = {
    default: "border border-line-03",  // 수정해서 쓰셔도 돼요.
    roundedOutline: "border border-line-03 rounded-[100px] bg-white",
    filled: "rounded-[2px] bg-[var(--color-surface-second)]",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch?.(value);
    }
  };

  return (
    <div
      className={`flex items-center p-[12px] ${variantClasses[variant]} ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {showPrefix && <span className="mr-[8px]">{prefixIcon ? prefixIcon : <SearchIcon size={prefixSize} color={prefixColor}/>}</span>}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`flex-1 focus:outline-none ${inputClassName}`}
      />
      {showClearButton && value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <CloseIcon />
        </button>
      )}
      {/* {suffixIcon && <span className="ml-2 text-gray-500">{suffixIcon}</span>} */}
    </div>
  );
};
