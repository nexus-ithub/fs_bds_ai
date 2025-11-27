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

export interface AdditionalInfo {
  gender?: string;
  age?: number;
  interests?: number[];
}

export const AGES = [
  { id: 1, value: '20대 이하', label: '20대 이하' },
  { id: 2, value: '20대', label: '20대' },
  { id: 3, value: '30대', label: '30대' },
  { id: 4, value: '40대', label: '40대' },
  { id: 5, value: '50대', label: '50대' },
  { id: 6, value: '60대', label: '60대' },
  { id: 7, value: '70대', label: '70대' },
  { id: 8, value: '80대 이상', label: '80대 이상' },
]
export const INTERESTS = [
  {id: 1, label: '상업용'},
  {id: 2, label: '주거용'},
  {id: 3, label: '신축'},
  {id: 4, label: '구축'},
  {id: 5, label: '리모델링'},
  {id: 6, label: '재건축'}
];
export const ADDITIONAL_INFO = ['토지 보유', '건물 보유', '미보유'];