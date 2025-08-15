class ServiceErrorBuilder {
  private errors: string[] = [];

  add(message: string): this {
    this.errors.push(message);
    return this;
  }

  addFromArray(messages: string[]): this {
    this.errors.push(...messages);
    return this;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  clear(): this {
    this.errors = [];
    return this;
  }
}

export const createErrorBuilder = () => new ServiceErrorBuilder();

export const formatServiceError = (error: unknown, context?: string): string => {
  const prefix = context ? `${context}: ` : '';
  if (error instanceof Error) {
    return `${prefix}${error.message}`;
  }
  return `${prefix}Unknown error`;
};