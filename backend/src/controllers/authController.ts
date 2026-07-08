import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, nik, email, password, role, nip } = req.body;

    if (!name || !nik || !email || !password) {
      res.status(400).json({ status: 'error', message: 'Semua kolom input wajib diisi.' });
      return;
    }

    const userRole = role === 'OFFICER' ? 'OFFICER' : 'CUSTOMER';

    // Verify NIP is provided for officer registration
    if (userRole === 'OFFICER' && !nip) {
      res.status(400).json({ status: 'error', message: 'Nomor Induk Pegawai (NIP) wajib diisi untuk pendaftaran petugas.' });
      return;
    }

    // Check if email or NIK already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nik },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        res.status(400).json({ status: 'error', message: 'Email sudah terdaftar.' });
        return;
      }
      if (existingUser.nik === nik) {
        res.status(400).json({ status: 'error', message: 'NIK sudah terdaftar.' });
        return;
      }
    }

    // Check duplicate NIP if registering as officer
    if (userRole === 'OFFICER' && nip) {
      const existingNip = await prisma.user.findUnique({
        where: { nip },
      });
      if (existingNip) {
        res.status(400).json({ status: 'error', message: 'NIP sudah terdaftar.' });
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        nik,
        email,
        password: hashedPassword,
        role: userRole,
        nip: userRole === 'OFFICER' ? nip : null,
      },
      select: {
        id: true,
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
    const { identifier, password } = req.body; // identifier can be email or NIK

    if (!identifier || !password) {
      res.status(400).json({ status: 'error', message: 'Email/NIK dan password wajib diisi.' });
      return;
    }

    // Find user by email or NIK
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { nik: identifier },
        ],
      },
    });

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
