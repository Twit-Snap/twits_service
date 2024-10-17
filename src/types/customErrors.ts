export class NotFoundError extends Error {
  entityName: string;
  entityId: string;

  constructor(entityName: string, entityId: string) {
    super(`${entityName} not found`);
    this.entityName = entityName;
    this.entityId = entityId;
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  field: string;
  detail: string;

  constructor(field: string, detail: string) {
    super(`Validation error: ${field}`);
    this.field = field;
    this.detail = detail;
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor() {
    super('Authentication error');
    this.name = 'AuthenticationError';
  }
}

export class ServiceUnavailable extends Error {
  constructor() {
    super('Service Unavailable error');
    this.name = 'ServiceUnavailable';
  }
}
