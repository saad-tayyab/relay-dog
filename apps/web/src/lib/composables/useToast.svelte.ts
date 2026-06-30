/**
 * Global toast notification state.
 * Follows the project composable pattern with getter-based returns.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.show({ message: 'Relay added', type: 'success' });
 *   toast.show({ message: 'Deleted', type: 'success', undoLabel: 'Undo', onUndo: () => {} });
 *   toast.hide();
 */

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  undoLabel?: string;
  onUndo?: () => void;
}

export function useToast() {
  let visible = $state(false);
  let message = $state('');
  let type = $state<'success' | 'error' | 'info'>('success');
  let duration = $state(5000);
  let undoLabel = $state<string | undefined>(undefined);
  let onUndo = $state<(() => void) | undefined>(undefined);
  let key = $state(0);

  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (dismissTimer !== null) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
  }

  function show(options: ToastOptions): void {
    clearTimer();
    message = options.message;
    type = options.type ?? 'success';
    duration = options.duration ?? 5000;
    undoLabel = options.undoLabel;
    onUndo = options.onUndo;
    key++;
    visible = true;

    // Auto-dismiss
    dismissTimer = setTimeout(() => {
      hide();
    }, duration);
  }

  function hide(): void {
    clearTimer();
    visible = false;
  }

  function reset(): void {
    clearTimer();
    visible = false;
    message = '';
    type = 'success';
    duration = 5000;
    undoLabel = undefined;
    onUndo = undefined;
  }

  return {
    get visible() {
      return visible;
    },
    get message() {
      return message;
    },
    get type() {
      return type;
    },
    get duration() {
      return duration;
    },
    get undoLabel() {
      return undoLabel;
    },
    get onUndo() {
      return onUndo;
    },
    get key() {
      return key;
    },
    show,
    hide,
    reset,
  };
}
