import { StatusCodes, ReasonPhrases } from 'http-status-codes';

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
}

export function formatSuccessResponse<T>(status: StatusCodes, data: T | null): ApiResponse<T> {
  return {
    status,
    message: "success",
    data
  };
}

export function formatErrorResponse(status: StatusCodes, errorMessage: string): ApiResponse<null> {
  return {
    status,
    message: errorMessage,
    data: null
  };
}
