// Better Auth returns failures as { error } instead of throwing
export type SignUpApiError = {
  status?: number;
  code?: string;
  message?: string;
};

export type SignUpResult = {
  error?: SignUpApiError | null;
  [key: string]: unknown;
} | null;

export type SignUpError = SignUpApiError & Error;
