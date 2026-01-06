import { ApiError } from '@/lib/api-client';

/**
 * Extract a user-friendly error message with requestId for debugging
 * Format: "Error message (Request ID: abc123)"
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error && 'requestId' in error && error.requestId) {
    const apiError = error as ApiError & { requestId: string };
    return `${apiError.message} (Request ID: ${apiError.requestId})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Extract just the requestId from an error
 */
export function getRequestId(error: unknown): string | null {
  if (error instanceof Error && 'requestId' in error && error.requestId) {
    const apiError = error as ApiError & { requestId: string };
    return apiError.requestId;
  }
  return null;
}

/**
 * Copy text to clipboard, return success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch {
    return false;
  }
}
