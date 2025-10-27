export const FormField = ({
  label,
  type="text",
  placeholder,
  value,
  onChange,
  rightElement,
  required=false,
  disabled=false,
}: {
  label: string,
  type?: string,
  placeholder?: string,
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  rightElement?: React.ReactNode,
  required?: boolean,
  disabled?: boolean,
}) => {
  return (
    <div className="flex flex-col gap-[12px]">
      <label htmlFor={label} className="font-s2 text-text-02">{label} {required && <span className="text-secondary-050">*</span>}</label>
      <div className="relative">
        <input
          type={type}
          id={label}
          name={label}
          required={required}
          disabled={disabled}
          className="w-full rounded-[2px] border border-line-03 px-[14px] py-[12px] pr-[74px] focus:outline-none appearance-none"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
        {rightElement && (
          <div className="absolute right-[12px] top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}