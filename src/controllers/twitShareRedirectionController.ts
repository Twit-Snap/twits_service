import { Request, Response } from 'express';

export const redirectToTwit = (req: Request, res: Response) => {
  const { twitId } = req.params;

  try {
    console.log(`Redirecting to twit with id: ${twitId}`);
    res.redirect(`myapp://twits/${twitId}`);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
}