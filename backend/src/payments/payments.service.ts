
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayment(data: any) {
    return this.prisma.payment.create({ data });
  }

  async confirmPayment(paypalId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { paypalId } });
    if (!payment) return null;
    return this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'completed' } });
  }
}