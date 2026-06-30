/** Map raw errors to stable categories safe to persist and return via API. */
export function categorizeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'request_failed';
  }

  const message = error.message.toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  if (message.includes('econnrefused') || message.includes('connection refused')) {
    return 'connection_refused';
  }
  if (message.includes('enotfound') || message.includes('getaddrinfo')) {
    return 'dns_error';
  }
  if (message.includes('tls') || message.includes('ssl') || message.includes('certificate')) {
    return 'tls_error';
  }
  if (message.includes('not allowed') || message.includes('invalid url')) {
    return 'invalid_target';
  }
  if (message.includes('websocket')) {
    return 'websocket_error';
  }

  return 'request_failed';
}
