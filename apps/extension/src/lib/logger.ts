const TAG = "[Job Fit]";

export const logger = {
  info(...args: unknown[]): void {
    console.info(TAG, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(TAG, ...args);
  },
  error(...args: unknown[]): void {
    console.error(TAG, ...args);
  },
};
