

interface TabButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const TabButton: React.FC<TabButtonProps> = ({ 
  selected, 
  onClick, 
  children, 
  className = '', 
}) => {
  
  const classes = selected 
    ? 'border-b-[2px] border-primary border-t-[2px] border-t-transparent' 
    : 'border-b-[1px] border-line-03 border-t-[2px] border-t-transparent text-text-04';

  
  return (
    <button
      onClick={onClick}
      className={`font-s2 ${className} ${classes}`}
    >
      {children}
    </button>
  );
};