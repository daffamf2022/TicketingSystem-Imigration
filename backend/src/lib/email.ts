import nodemailer from 'nodemailer';

const smtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !Number.isInteger(port) || port <= 0 || !user || !password || !from) {
    return null;
  }

  return { host, port, user, password, from };
};

export const isSmtpConfigured = (): boolean => smtpConfig() !== null;

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string): Promise<void> => {
  const config = smtpConfig();
  if (!config) {
    throw new Error('Konfigurasi SMTP belum lengkap.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: 'Tautan Atur Ulang Kata Sandi SIAP.PRIORITAS',
    text: [
      `Halo ${name},`,
      '',
      'Gunakan tautan berikut untuk mengatur ulang kata sandi akun Anda di SIAP.PRIORITAS:',
      resetUrl,
      '',
      'Tautan berlaku selama 1 jam dan hanya dapat digunakan satu kali.',
      'Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini.',
    ].join('\n'),
  });
};
