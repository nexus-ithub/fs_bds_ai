
export interface DividerProps {
  className?: string;
  dashed?: boolean;
  colorClassName?: string;
}


export const HDivider = ({ className, colorClassName = 'bg-line-03', dashed }: DividerProps) => {
  return <div className={`flex items-center w-full h-[1px] ${colorClassName} ${className} ${dashed ? 'border-dashed' : ''}`}/>;
};


export const VDivider = ({ className, colorClassName = 'bg-line-02' }: DividerProps) => {
  return <div className={`w-[1px] h-[14px] ${colorClassName} ${className}`}/>;
};