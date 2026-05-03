import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');
    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwt.sign(payload), totpEnabled: user.totpEnabled };
  }

  async setupTotp(userId: string) {
    const secret = speakeasy.generateSecret({ name: 'Track.Art Admin', length: 32 });
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
