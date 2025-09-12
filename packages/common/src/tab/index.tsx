
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
  
  return (
    <button
      onClick={onClick}
      className={`flex relative font-s2 ${className}`}
    >
      {children}
      {selected ? (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />
      ) : (
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-line-03" />
      )}
    </button>
  );
};

export const SubTabButton: React.FC<TabButtonProps> = ({
  selected,
  onClick,
  children,
  className = '',
}) => {
  const classes = selected ? 'text-primary' : 'text-text-04';
  return(
    <button
      onClick={onClick}
      className={`flex font-s4 ${className} ${classes}`}
    >
      {children}
    </button>
  )
}