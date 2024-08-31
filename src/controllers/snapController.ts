import { Request, Response, NextFunction } from 'express';
import Snap from '../models/Snap';

export const createSnap = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const snap = new Snap({ message });
    const savedSnap = await snap.save();
    res.status(201).json({ data: savedSnap });
  } catch (error) {
    next(error);
  }
};

export const getAllSnaps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snaps = await Snap.find().sort({ createdAt: -1 });
    res.status(200).json({ data: snaps });
  } catch (error) {
    next(error);
  }
};