export class ApiResponseDto<T> {
  data?: T;
  error?: {
    message: string;
    error?: any;
  };
  message: string;
}
