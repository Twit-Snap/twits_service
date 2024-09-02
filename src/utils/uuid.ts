import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class UUID {
  static generate(): string {
    const uuid = uuidv4();
    return uuid;
  }

  static isValid(value: string): boolean {
    return uuidValidate(value);
  }
}
