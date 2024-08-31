export type SnapResponse = {
  id: string;
  message: string;
}

export type CreateSnapBody = Omit<SnapResponse, 'id'>;