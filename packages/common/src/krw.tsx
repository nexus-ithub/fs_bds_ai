


export const krwUnit = (amount: number, firstUnit?: boolean) => {
  if (amount >= 100000000) {
    const eok = amount / 100000000;
    const man = (amount % 100000000) / 10000;
    if (man > 0) {
      if (firstUnit) {
        return `${eok.toFixed(1)}억`;
      }
      return `${Math.floor(eok)}억 ${Math.floor(man)}만원`;
    }
    return `${Math.floor(eok)}억`;
  } else if (amount >= 10000) {
    const man = amount / 10000;
    const remainder = amount % 10000;
    if (remainder > 0) {
      if (firstUnit) {
        return `${man.toFixed(1)}만`;
      }
      return `${Math.floor(man)}만 ${Math.floor(remainder).toLocaleString()}원`;
    }
    return `${man.toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
};

export const pricePerM2ToPyong = (amount: number) => {
  return amount * 3.305785;
}

