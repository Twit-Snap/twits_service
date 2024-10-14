export interface ILikeController {
  validateTwitId(twitId: string | undefined): string;

  validateUserId(userId: number | undefined): number;
}

export interface ITwitController {
  validateContent(content: string | undefined): string;

  validateUsersIds(usersIds: number[] | undefined): number[];
}
