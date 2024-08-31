import { Request, Response, NextFunction } from 'express';
import { ISnapRepository, SnapRepository } from '../repositories/snapRepository';
import { SnapResponse, CreateSnapBody } from '../types/types';

const snapRepository: ISnapRepository = new SnapRepository();

export const createSnap = async (req: Request<{}, {}, CreateSnapBody>, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const savedSnap: SnapResponse = await snapRepository.create(message);
    res.status(201).json({ data: savedSnap });
  } catch (error) {
    next(error);
  }
};

export const getAllSnaps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snaps: SnapResponse[] = await snapRepository.findAll();
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};