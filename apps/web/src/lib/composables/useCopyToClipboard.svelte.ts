// Clipboard composable with feedback for Svelte 5 runes
// Handles clipboard API errors gracefully and provides visual feedback state

export function useClipboard() {
  let copied = $state(false);
  let error = $state<string | null>(null);
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (resetTimer !== null) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
  }

  async function copy(text: string): Promise<boolean> {
    clearTimers();
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      error = null;
      resetTimer = setTimeout(() => {
        copied = false;
        resetTimer = null;
      }, 2000);
      return true;
    } catch (e) {
      copied = false;
      error = e instanceof Error ? e.message : 'Failed to copy to clipboard';
      resetTimer = setTimeout(() => {
        error = null;
        resetTimer = null;
      }, 3000);
      return false;
    }
  }

  return {
    get copied() {
      return copied;
    },
    get error() {
      return error;
    },
    copy,
  };
}
