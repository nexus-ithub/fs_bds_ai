import { RadioIcon } from "../icons"

export const Radio = ({
  label,
  value,
  checked,
  onChange,
}: {
  label: string,
  value: string,
  checked: boolean,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
}) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input 
        type="radio" 
        name="option" 
        value={value} 
        className="peer hidden" 
        checked={checked} 
        onChange={onChange}/>
      <RadioIcon color={checked ? '#4E52FF' : '#DCDEE2'}/>
      <span className="font-s2 text-text-02">{label}</span>
    </label>
  )
}