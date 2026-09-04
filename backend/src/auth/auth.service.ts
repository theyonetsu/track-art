import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

export type JwtPayload = { sub: string; email: string; role: string };

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async register(data: { email: string; password: string; name?: string; studioName?: string; phone?: string }) {
    const email = (data.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Adresse email invalide');
    if (!data.password || data.password.length < 8) throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Un compte existe déjà avec cet email');
    const hash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hash,
        role: 'PHOTOGRAPHER',
        name: data.name?.trim() || null,
        studioName: data.studioName?.trim() || null,
        phone: data.phone?.trim() || null,
      },
    });
    return this.login(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: (email ?? '').trim().toLowerCase() } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    const valid = await bcrypt.compare(password ?? '', user.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');
    return user;
  }

  async login(user: { id: string; email: string; role: string; totpEnabled: boolean; name?: string | null; studioName?: string | null }) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwt.sign(payload),
      totpEnabled: user.totpEnabled,
      user: { id: user.id, email: user.email, role: user.role, name: user.name ?? null, studioName: user.studioName ?? null },
    };
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(current ?? '', user.password);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect');
    if (!next || next.length < 8) throw new BadRequestException('Le nouveau mot de passe doit contenir au moins 8 caractères');
    await this.prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(next, 12) } });
    return { success: true };
  }

  async setupTotp(userId: string) {
    const secret = speakeasy.generateSecret({ name: 'Track.Art', length: 32 });
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecret: secret.ascii } });
    const qr = await qrcode.toDataURL(secret.otpauth_url);
    return { qr, secret: secret.ascii };
  }

  async verifyTotp(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = speakeasy.totp.verify({ secret: user.totpSecret, encoding: 'ascii', token, window: 1 });
    if (!valid) throw new UnauthorizedException('Code 2FA invalide');
    await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
    return { success: true };
  }
}
