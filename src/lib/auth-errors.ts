export type AuthErrorCode =
  | "USER_NOT_FOUND"
  | "FAILED_TO_CREATE_USER"
  | "FAILED_TO_CREATE_SESSION"
  | "FAILED_TO_UPDATE_USER"
  | "FAILED_TO_GET_SESSION"
  | "INVALID_PASSWORD"
  | "INVALID_EMAIL"
  | "INVALID_EMAIL_OR_PASSWORD"
  | "SOCIAL_ACCOUNT_ALREADY_LINKED"
  | "PROVIDER_NOT_FOUND"
  | "INVALID_TOKEN"
  | "ID_TOKEN_NOT_SUPPORTED"
  | "FAILED_TO_GET_USER_INFO"
  | "USER_EMAIL_NOT_FOUND"
  | "EMAIL_NOT_VERIFIED"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_TOO_LONG"
  | "USER_ALREADY_EXISTS"
  | "EMAIL_CAN_NOT_BE_UPDATED"
  | "CREDENTIAL_ACCOUNT_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "FAILED_TO_UNLINK_LAST_ACCOUNT"
  | "ACCOUNT_NOT_FOUND"
  | "USER_ALREADY_HAS_PASSWORD";

export type AuthErrorContext =
  | { type: "email"; email: string }
  | { type: "username"; username: string }
  | { type: "signup" }
  | { type: "social"; provider: string }
  | null;

export interface AuthError {
  code?: AuthErrorCode | string;
  message?: string | null;
}

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  USER_NOT_FOUND: "User not found",
  FAILED_TO_CREATE_USER: "Failed to create account. Please try again.",
  FAILED_TO_CREATE_SESSION: "Failed to sign in. Please try again.",
  FAILED_TO_UPDATE_USER: "Failed to update account. Please try again.",
  FAILED_TO_GET_SESSION: "Failed to retrieve session. Please try again.",
  INVALID_PASSWORD: "Invalid password",
  INVALID_EMAIL: "Invalid email address",
  INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
  SOCIAL_ACCOUNT_ALREADY_LINKED:
    "This account is already linked to another user",
  PROVIDER_NOT_FOUND: "Authentication provider not found",
  INVALID_TOKEN: "Invalid or expired token",
  ID_TOKEN_NOT_SUPPORTED: "ID token not supported for this provider",
  FAILED_TO_GET_USER_INFO: "Failed to retrieve user information",
  USER_EMAIL_NOT_FOUND: "User not found with that email",
  EMAIL_NOT_VERIFIED: "Please verify your email address",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_TOO_LONG: "Password must be at most 128 characters",
  USER_ALREADY_EXISTS: "An account with this email already exists",
  EMAIL_CAN_NOT_BE_UPDATED: "Email address cannot be updated",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Account not found",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "Cannot unlink the last authentication method",
  ACCOUNT_NOT_FOUND: "Account not found",
  USER_ALREADY_HAS_PASSWORD: "User already has a password set",
};

function getContextualErrorMessage(
  errorCode: AuthErrorCode,
  context: AuthErrorContext
): string | null {
  if (!context) {
    return null;
  }

  if (
    (errorCode === "USER_NOT_FOUND" ||
      errorCode === "USER_EMAIL_NOT_FOUND" ||
      errorCode === "CREDENTIAL_ACCOUNT_NOT_FOUND") &&
    context.type === "email"
  ) {
    return "User not found with that email";
  }

  if (
    (errorCode === "USER_NOT_FOUND" ||
      errorCode === "CREDENTIAL_ACCOUNT_NOT_FOUND") &&
    context.type === "username"
  ) {
    return "User not found with that username";
  }

  if (errorCode === "PROVIDER_NOT_FOUND" && context.type === "social") {
    return `Authentication provider "${context.provider}" is not available`;
  }

  if (errorCode === "FAILED_TO_GET_USER_INFO" && context.type === "social") {
    return `Failed to retrieve information from ${context.provider}. Please try again.`;
  }

  return null;
}

function getMessageFromErrorText(
  message: string,
  context?: AuthErrorContext
): string {
  if (
    context?.type === "email" &&
    (message.toLowerCase().includes("user not found") ||
      message.toLowerCase().includes("no user found") ||
      message.toLowerCase().includes("user does not exist"))
  ) {
    return "User not found with that email";
  }
  return message;
}

export function getAuthErrorMessage(
  error: AuthError | null | undefined,
  context?: AuthErrorContext
): string {
  if (!error) {
    return "An error occurred. Please try again.";
  }

  if (!error.code && error.message) {
    return getMessageFromErrorText(error.message, context);
  }

  const errorCode = error.code as AuthErrorCode | undefined;

  if (errorCode && context) {
    const contextualMessage = getContextualErrorMessage(errorCode, context);
    if (contextualMessage) {
      return contextualMessage;
    }
  }

  if (errorCode && errorCode in ERROR_MESSAGES) {
    return ERROR_MESSAGES[errorCode];
  }

  return error.message || "An error occurred. Please try again.";
}
