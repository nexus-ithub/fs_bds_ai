import { ArrowUpLong, ArrowDownLong, MinusSmallIcon } from "@repo/common";

export const calculateChangeRate = (current: number, previous: number) => {
  if (current === 0 && previous === 0) {
    return { percent: '0.0', status: 'same' };
  }
  
  let change;
  if (previous === 0) {
    change = ((current - previous) / 1) * 100;
  } else {
    change = ((current - previous) / previous) * 100;
  }
  const status = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'same';
  
  return {
    percent: Math.abs(change).toFixed(1),
    status,
  };
};

export const ChangeRate = ({current, previous}: {current: number, previous: number}) => {
  const changeRate = calculateChangeRate(current, previous);
  return (
    <p className={`flex items-center font-s2 ${changeRate.status === 'increase' ? 'text-secondary-050' : changeRate.status === 'decrease' ? 'text-primary' : ''} mr-[2px]`}>
      {changeRate.percent}%
      <span>
        {changeRate.status === 'increase' 
          ? <ArrowUpLong /> 
          : changeRate.status === 'decrease' 
          ? <ArrowDownLong /> 
          : <MinusSmallIcon />}
      </span>
    </p>
  );
};