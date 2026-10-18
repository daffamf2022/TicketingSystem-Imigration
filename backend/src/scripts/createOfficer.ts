import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const promptHidden = (message: string): Promise<string> => {
  const input = process.stdin;

  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return Promise.reject(new Error('Perintah ini harus dijalankan di terminal interaktif.'));
  }

  process.stdout.write(message);
  input.setRawMode(true);
  input.resume();

  return new Promise((resolve, reject) => {
    let value = '';

    const finish = (error?: Error) => {
      input.off('data', onData);
      input.setRawMode(false);
      process.stdout.write('\n');

      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    };

    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Pembuatan akun dibatalkan.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    input.on('data', onData);
  });
};

async function main(): Promise<void> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });

  let email: string;
  let name: string;
  let nip: string;

  try {
    console.log('Menyiapkan akun petugas layanan prioritas.');
    email = (await terminal.question('Email: ')).trim().toLowerCase();
    name = (await terminal.question('Nama petugas: ')).trim();
    nip = (await terminal.question('NIP: ')).trim();
  } finally {
    terminal.close();
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Format email tidak valid.');
  }
  if (!name || !nip) {
    throw new Error('Nama petugas dan NIP wajib diisi.');
  }

  const password = await promptHidden('Password (minimal 8 karakter, input tersembunyi): ');
  if (password.length < 8) {
    throw new Error('Password minimal 8 karakter.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const existingOfficer = await tx.user.findFirst({
      where: { role: 'OFFICER' },
      select: { id: true, email: true },
    });
    const officerWithNip = await tx.user.findUnique({
      where: { nip },
      select: { id: true },
    });
    if (officerWithNip && officerWithNip.id !== existingOfficer?.id) {
      throw new Error('NIP sudah digunakan oleh akun lain.');
    }

    if (existingOfficer) {
      if (existingOfficer.email !== email) {
        throw new Error('Akun petugas sudah ada dengan email lain.');
      }

      await tx.user.update({
        where: { id: existingOfficer.id },
        data: { name, nip, password: hashedPassword },
      });
      return;
    }

    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name,
          role: 'OFFICER',
          nip,
        },
      });
      return;
    }

    await tx.user.create({
      data: {
        username: `petugas_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        name,
        nik: `ADMIN-${randomUUID()}`,
        email,
        password: hashedPassword,
        role: 'OFFICER',
        nip,
      },
    });
  });

  console.log(`Akun petugas ${name} (NIP ${nip}) berhasil disiapkan. Silakan masuk menggunakan email tersebut.`);
}

main()
  .catch((error: unknown) => {
    console.error('Gagal membuat akun petugas:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
