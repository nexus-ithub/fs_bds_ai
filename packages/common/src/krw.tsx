


export const krwUnit = (amount: number, firstUnit?: boolean) => {
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    if (man > 0) {
      if (firstUnit) {
        return `${eok}억`;
      }
      return `${eok}억 ${man}만원`;
    }
    return `${eok}억`;
  } else if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    const remainder = amount % 10000;
    if (remainder > 0) {
      if (firstUnit) {
        return `${man}만`;
      }
      return `${man}만 ${remainder.toLocaleString()}원`;
    }
    return `${man.toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
};
