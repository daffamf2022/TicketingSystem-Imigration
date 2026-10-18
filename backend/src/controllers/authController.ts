import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { isSmtpConfigured, sendPasswordResetEmail } from '../lib/email';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        name: true,
        nik: true,
        email: true,
        role: true,
        nip: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const sendUserPasswordResetLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawUserId = req.params.id;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'ID pengguna tidak valid.',
      });
      return;
    }

    if (!process.env.FRONTEND_URL || !isSmtpConfigured()) {
      res.status(503).json({
        status: 'error',
        message: 'Layanan email belum dikonfigurasi. Tautan atur ulang kata sandi belum dapat dikirim.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user || user.role !== 'OFFICER') {
      res.status(400).json({
        status: 'error',
        message: 'Tautan atur ulang hanya dapat dikirim untuk akun petugas yang terdaftar.',
      });
      return;
    }

    let resetUrl: URL;
    try {
      resetUrl = new URL('/reset-password', process.env.FRONTEND_URL);
    } catch {
      res.status(503).json({
        status: 'error',
        message: 'Alamat aplikasi pada konfigurasi FRONTEND_URL tidak valid.',
      });
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    resetUrl.searchParams.set('token', token);

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl.toString());
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
      next(error);
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Tautan atur ulang kata sandi telah dikirim ke alamat email akun petugas.',
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ status: 'error', message: 'Masukkan alamat email yang valid.' });
      return;
    }

    if (!process.env.FRONTEND_URL || !isSmtpConfigured()) {
      res.status(503).json({
        status: 'error',
        message: 'Layanan email belum dikonfigurasi. Tautan atur ulang kata sandi belum dapat dikirim.',
      });
      return;
    }

    const genericMessage = 'Jika email terdaftar sebagai akun pemohon, tautan atur ulang kata sandi akan dikirim ke email tersebut.';
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user || user.role !== 'CUSTOMER') {
      res.status(200).json({ status: 'success', message: genericMessage });
      return;
    }

    let resetUrl: URL;
    try {
      resetUrl = new URL('/reset-password', process.env.FRONTEND_URL);
    } catch {
      res.status(503).json({
        status: 'error',
        message: 'Alamat aplikasi pada konfigurasi FRONTEND_URL tidak valid.',
      });
      return;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { tokenHash, expiresAt },
      create: { userId: user.id, tokenHash, expiresAt },
    });

    resetUrl.searchParams.set('token', token);
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl.toString());
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
      next(error);
      return;
    }

    res.status(200).json({ status: 'success', message: genericMessage });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordWithToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (!/^[a-f0-9]{64}$/i.test(token) || newPassword.length < 8) {
      res.status(400).json({
        status: 'error',
        message: 'Tautan tidak valid atau kata sandi baru kurang dari 8 karakter.',
      });
      return;
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const reset = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!reset) {
      res.status(400).json({
        status: 'error',
        message: 'Tautan atur ulang tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru melalui halaman masuk.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const consumed = await prisma.$transaction(async (tx) => {
      const deleted = await tx.passwordResetToken.deleteMany({
        where: { id: reset.id, tokenHash, expiresAt: { gt: new Date() } },
      });
      if (deleted.count !== 1) {
        return false;
      }

      await tx.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      });
      return true;
    });

    if (!consumed) {
      res.status(400).json({
        status: 'error',
        message: 'Tautan atur ulang sudah digunakan atau kedaluwarsa.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Kata sandi berhasil diatur ulang. Silakan masuk menggunakan kata sandi baru.',
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const nik = typeof req.body.nik === 'string' ? req.body.nik.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = req.body.role;

    if (!name || !username || !nik || !email || !password) {
      res.status(400).json({ status: 'error', message: 'Semua kolom input wajib diisi.' });
      return;
    }

    if (!/^[a-z][a-z0-9._-]{3,29}$/.test(username)) {
      res.status(400).json({
        status: 'error',
        message: 'Nama pengguna harus 4-30 karakter, diawali huruf, dan hanya berisi huruf, angka, titik, garis bawah, atau tanda hubung.',
      });
      return;
    }

    if (!/^\d{16}$/.test(nik)) {
      res.status(400).json({ status: 'error', message: 'NIK harus terdiri dari 16 digit angka.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ status: 'error', message: 'Format email tidak valid.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ status: 'error', message: 'Kata sandi minimal harus terdiri dari 8 karakter.' });
      return;
    }

    if (role === 'OFFICER') {
      res.status(403).json({
        status: 'error',
        message: 'Akun petugas hanya dapat dibuat melalui perintah admin:create di backend.',
      });
      return;
    }

    const userRole = 'CUSTOMER';

    // Check whether the username, email, or NIK is already registered.
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { nik },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        res.status(400).json({ status: 'error', message: 'Nama pengguna sudah digunakan.' });
        return;
      }
      if (existingUser.email === email) {
        res.status(400).json({ status: 'error', message: 'Email sudah terdaftar.' });
        return;
      }
      if (existingUser.nik === nik) {
        res.status(400).json({ status: 'error', message: 'NIK sudah terdaftar.' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        name,
        nik,
        email,
        password: hashedPassword,
        role: userRole,
        nip: null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        nik: true,
        email: true,
        role: true,
        nip: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      res.status(400).json({ status: 'error', message: 'Nama pengguna, NIK, atau email dan kata sandi wajib diisi.' });
      return;
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const user = identifier.includes('@')
      ? await prisma.user.findUnique({ where: { email: normalizedIdentifier } })
      : /^\d{16}$/.test(identifier)
        ? await prisma.user.findUnique({ where: { nik: identifier } })
        : await prisma.user.findUnique({ where: { username: normalizedIdentifier } });

    if (!user) {
      res.status(401).json({ status: 'error', message: 'Kredensial login tidak valid.' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ status: 'error', message: 'Kredensial login tidak valid.' });
      return;
    }

    if (user.role !== 'CUSTOMER' && user.role !== 'OFFICER') {
      res.status(403).json({
        status: 'error',
        message: 'Peran akun tidak diizinkan untuk masuk.',
      });
      return;
    }

    // Generate JWT token containing role claims
    const secret = process.env.JWT_SECRET || 'development_jwt_secret_key_12345';
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '1d' });

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          nik: user.nik,
          email: user.email,
          role: user.role,
          nip: user.nip,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
