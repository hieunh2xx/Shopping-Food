export interface IFaqDto {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateFaqRequest {
  question: string;
  answer: string;
  displayOrder: number;
}

export interface IUpdateFaqRequest {
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
}
