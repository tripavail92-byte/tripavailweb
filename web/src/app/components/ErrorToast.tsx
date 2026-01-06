'use client';

import { useState } from 'react';
import { getRequestId, copyToClipboard } from '@/lib/error-utils';

export interface ErrorToastProps {
  error: unknown;
  message: string;
  onDismiss?: () => void;
}

/**
 * Smart error toast that shows message + copy-to-clipboard for requestId
 * Makes support debugging instant
 */
export function ErrorToast({ error, message, onDismiss }: ErrorToastProps) {
  const [copied, setCopied] = useState(false);
  const requestId = getRequestId(error);

  const handleCopy = async () => {
    if (!requestId) return;
    const success = await copyToClipboard(requestId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{message}</div>
          {requestId && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-700 font-mono">
              <span>ID: {requestId}</span>
              <button
                onClick={handleCopy}
                className="ml-2 rounded px-2 py-1 bg-red-100 hover:bg-red-200 transition"
                title="Copy request ID to clipboard"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition font-bold"
            title="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
