import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class UUID {
  static generate(): string {
    return uuidv4();
  }

  static isValid(value: string): boolean {
    return uuidValidate(value);
  }
}