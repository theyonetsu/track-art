import { Controller, Post, Get, Body, Headers, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('create-order')
  createOrder(@Body() body: { galleryId: string; photoIds: string[] }, @Headers('x-gallery-token') token?: string) {
    return this.svc.createOrder(body.galleryId, body.photoIds, token);
  }

  @Post('create-extension-order')
  createExtension(@Body() body: { galleryId: string }, @Headers('x-gallery-token') token?: string) {
    return this.svc.createExtensionOrder(body.galleryId, token);
  }

  @Post('capture-order')
  captureOrder(@Body() body: { paypalOrderId: string; internalId: string }) {
    return this.svc.captureOrder(body.paypalOrderId, body.internalId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@Req() req) { return this.svc.listForUser(req.user); }

  @Post('webhook')
  async webhook(@Body() body: any) {
    if (body?.event_type === 'PAYMENT.CAPTURE.COMPLETED') await this.svc.confirmPayment(body.resource?.id);
    return { received: true };
  }
}
