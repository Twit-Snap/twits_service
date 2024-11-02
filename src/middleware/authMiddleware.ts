import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import { JWTService } from '../service/jwtService';
import {
  AuthenticationError,
  BlockedError,
  NotFoundError,
  ServiceUnavailable,
  ValidationError
} from '../types/customErrors';
import { JwtCustomPayload } from '../types/jwt';

const decodeToken = (authHeader: string | undefined): JwtCustomPayload => {
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('Middleware: No token provided');
    throw new AuthenticationError();
  }

  const jwtService = new JWTService();
  return jwtService.verify(token) as JwtCustomPayload;
};

const checkBlockedUser = async (decodedToken: JwtCustomPayload) => {
  if (decodedToken.type === 'admin') {
    return;
  }

  await axios
    .get(`${process.env.USERS_SERVICE_URL}/users/${decodedToken.username}`, {
      headers: { Authorization: `Bearer ${new JWTService().sign(decodedToken)}` }
    })
    .catch(error => {
      switch (error.status) {
        case 400:
          throw new ValidationError(error.response.data.field, error.response.data.detail);
        case 401:
          throw new AuthenticationError();
        case 403:
          throw new BlockedError();
        case 404:
          throw new NotFoundError('username', decodedToken.username);
        case 500:
          throw new ServiceUnavailable();
      }
    });
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader: string | undefined = req.headers['authorization'];

    const decoded: JwtCustomPayload = decodeToken(authHeader);
    await checkBlockedUser(decoded);

    // Attach the decoded user information to the request object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
