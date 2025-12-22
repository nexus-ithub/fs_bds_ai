


export const krwUnit = (amount: number, firstUnit?: boolean) => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000000) {
    const eok = absAmount / 100000000;
    // const man = (absAmount % 100000000) / 10000;
    const man = Math.floor((absAmount % 100000000) / 10000);

    if (man > 0) {
      if (firstUnit) {
        // return `${isNegative ? '-' : ''}${eok.toFixed(1)}억`;
        return `${isNegative ? '-' : ''}${Number(eok.toFixed(1)).toLocaleString()}억`;
      }
      // return `${isNegative ? '-' : ''}${Math.floor(eok)}억 ${Math.floor(man)}만원`;
      return `${isNegative ? '-' : ''}${Math.floor(eok).toLocaleString()}억 ${man.toLocaleString()}만원`;
    }
    // return `${isNegative ? '-' : ''}${Math.floor(eok)}억`;
    return `${isNegative ? '-' : ''}${Math.floor(eok).toLocaleString()}억`;
  } else if (absAmount >= 10000) {
    const man = absAmount / 10000;
    const remainder = absAmount % 10000;
    if (remainder > 0) {
      if (firstUnit) {
        // return `${isNegative ? '-' : ''}${man.toFixed(1)}만`;
        return `${isNegative ? '-' : ''}${Number(man.toFixed(1)).toLocaleString()}만`;
      }
      // return `${isNegative ? '-' : ''}${Math.floor(man)}만 ${Math.floor(remainder).toLocaleString()}원`;
      return `${isNegative ? '-' : ''}${Math.floor(man).toLocaleString()}만 ${Math.floor(remainder).toLocaleString()}원`;
    }
    // return `${isNegative ? '-' : ''}${man.toLocaleString()}만원`;
    return `${isNegative ? '-' : ''}${Math.floor(man).toLocaleString()}만원`;
  }
  return `${isNegative ? '-' : ''}${absAmount.toLocaleString()}원`;
};

export const pricePerM2ToPyong = (amount: number) => {
  return amount * 3.305785;
}

