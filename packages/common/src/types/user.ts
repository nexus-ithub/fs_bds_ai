export interface User {
  id?: number;
  email: string;
  name: string;
  phone: string;
  profile?: string;
  provider?: string;
  marketingEmail?: string;
  marketingSms?: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationData = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

export const AGES = [
  { value: '20대 이하', label: '20대 이하' },
  { value: '20대', label: '20대' },
  { value: '30대', label: '30대' },
  { value: '40대', label: '40대' },
  { value: '50대', label: '50대' },
  { value: '60대', label: '60대' },
  { value: '70대', label: '70대' },
  { value: '80대 이상', label: '80대 이상' },
]
export const INTERESTS = ['상업용', '주거용', '신축', '구축', '리모델링', '재건축'];
export const ADDITIONAL_INFO = ['토지 보유', '건물 보유', '미보유'];