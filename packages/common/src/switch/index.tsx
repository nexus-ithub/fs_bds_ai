import React from "react";
import { OnIcon, OffIcon } from "../icons";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isLabel?: boolean;
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  isLabel = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-[21px] w-[42px] items-center rounded-full transition-colors duration-300 
        ${checked ? "bg-primary-040" : "bg-content-05"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-[17px] w-[17px] rounded-full bg-white shadow transform transition-transform duration-300
          ${checked ? "translate-x-[23px]" : "translate-x-[2px]"}`}
      />
      {isLabel && (
        <span
          className={`relative ${checked ? "right-[10px]" : "left-[6px]"}`}
        >
          {checked ? <OnIcon /> : <OffIcon />}
        </span>
      )}
    </button>
  );
};
