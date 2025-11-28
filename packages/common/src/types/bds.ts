export interface BdsSale {
    idx: string;
    name?: string;
    addr: string;
    platArea: number;
    totalArea: number;
    buildValue: number;
    sellProfit: number;
    saleId: string;
    saleAmount: number;
    memo: string;
    imagePath: string;
}


export interface BdConsultRequest {
  id: string;
  bdId: string;
  userId: string;
  name: string;
  phone: string;
  content: string;
  consultedYn: string;
  createdAt: string;
}


export const getShortAddress = (address: string) => {
    const addressArray = address.split(' ');
    if (addressArray.length < 2) {
      return address;
    }
    return addressArray[0] + ' ' + addressArray[1];
}
