export class ApplicationError extends Error {
  constructor({ code = 'UNEXPECTED_ERROR', message = 'Something went wrong.', field, details, correlationId } = {}) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.field = field;
    this.details = details;
    this.correlationId = correlationId;
  }
}

export function normalizeError(error) {
  if (error instanceof ApplicationError) return error;
  if (error?.name === 'AbortError') return new ApplicationError({ code: 'REQUEST_CANCELLED', message: 'The request was cancelled.' });
  return new ApplicationError({ code: 'NETWORK_ERROR', message: 'We could not complete the request. Try again.', details: { cause: error?.message } });
}
