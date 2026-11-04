export interface LogContext {
  userId?: string;
  courseId?: string;
  groupId?: string;
  repoId?: string;
  action?: string;
  [key: string]: unknown;
}

export const logger = {
  info(message: string, context?: LogContext): void {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },

  warn(message: string, context?: LogContext): void {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        ...context,
      })
    );
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const errorDetails =
      error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack,
          }
        : { rawError: String(error) };

    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        ...errorDetails,
        ...context,
      })
    );
  },
};
