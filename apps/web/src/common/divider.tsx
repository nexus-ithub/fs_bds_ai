



export interface DividerProps {
  className?: string;
  dashed?: boolean;
  colorClassName?: string;
}


export const HDivider = ({ className, dashed }: DividerProps) => {
  return <div className={`flex items-center w-full border border-t-[0px] border-b-[1px] border-b-line-03 ${className} ${dashed ? 'border-dashed' : ''}`}/>;
};


export const VDivider = ({ className, colorClassName = 'bg-line-02' }: DividerProps) => {
  return <div className={`w-[1px] h-[14px] ${colorClassName} ${className}`}/>;
};