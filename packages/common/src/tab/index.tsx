
interface TabButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  fontClassName?: string;
}

export const TabButton: React.FC<TabButtonProps> = ({ 
  selected, 
  onClick, 
  children, 
  className = '', 
  fontClassName = 'font-s2',
}) => {
  const classes = selected ? '' : 'text-text-04';
  return (
    <button
      onClick={onClick}
      className={`flex relative items-center justify-center ${fontClassName} ${className} ${classes}`}
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
  fontClassName = 'font-s4',
}) => {
  const classes = selected ? 'text-primary' : 'text-text-04';
  return(
    <button
      onClick={onClick}
      className={`flex ${fontClassName} ${className} ${classes}`}
    >
      {children}
    </button>
  )
}