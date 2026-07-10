export interface IActionLogDto {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  message: string;
  createdAt: string;
  createdBy?: string;
}

export interface IErrorLogDto {
  id: string;
  action: string;
  exceptionMessage: string;
  stackTrace?: string;
  createdAt: string;
}
