import { Request, Response, NextFunction } from 'express';

export const officerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'OFFICER') {
    res.status(403).json({ status: 'error', message: 'Akses ditolak. Layanan ini hanya untuk Petugas Kantor Imigrasi.' });
    return;
  }
  next();
};

export const customerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'CUSTOMER') {
    res.status(403).json({ status: 'error', message: 'Akses ditolak. Layanan ini hanya untuk pemohon.' });
    return;
  }
  next();
};
