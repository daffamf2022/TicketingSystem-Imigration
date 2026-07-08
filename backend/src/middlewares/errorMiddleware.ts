import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the complete error stack internally for debugging
  console.error('[Error Handler]:', err);

  // Handle Multer-specific upload limits or issues
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'error',
        message: 'Ukuran file melebihi batas 2MB. Silakan unggah file yang lebih kecil.',
      });
      return;
    }
    res.status(400).json({
      status: 'error',
      message: `Gagal mengunggah berkas: ${err.message}`,
    });
    return;
  }

  // Handle custom errors thrown from middleware (like format filters)
  if (err instanceof Error) {
    if (err.message.includes('Format file tidak didukung') || err.message.includes('Format berkas tidak diizinkan')) {
      res.status(400).json({
        status: 'error',
        message: err.message,
      });
      return;
    }
  }

  // Handle default centralized Express errors (prevents leaking database stack traces)
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.',
  });
};

export default errorHandler;
