



export interface BdsSale {
    idx: string;
    name: string;
    addr: string;
    platArea: number;
    totalArea: number;
    buildValue: number;
    sellProfit: number;
    saleId: string;
    saleAmount: number;
    // saleLoanRatio: number;
    // saleLoanRate: number;
    // saleIncomeEtc: number;
    memo: string;
    imagePath: string;
}

export const getShortAddress = (address: string) => {
    const addressArray = address.split(' ');
    if (addressArray.length < 2) {
      return address;
    }
    return addressArray[0] + ' ' + addressArray[1];
}
