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