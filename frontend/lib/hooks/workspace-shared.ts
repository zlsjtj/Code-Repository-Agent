"use client";

export type WorkspaceFeedbackHandlers = {
  setError: (message: string | null) => void;
  setStatusMessage: (message: string | null) => void;
};

export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
