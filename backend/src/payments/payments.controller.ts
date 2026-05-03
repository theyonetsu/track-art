import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('create-order')
  createOrder(@Body() body: { galleryId: string; photoIds: string[] }) {
    return this.svc.createOrder(body.galleryId, body.photoIds);
  }

  @Post('capture-order')
  captureOrder(@Body() body: { paypalOrderId: string; internalId: string }) {
    return this.svc.captureOrder(body.paypalOrderId, body.internalId);
  }

  @Post('webhook')
  async webhook(@Body() body: any) {
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      await this.svc.confirmPayment(body.resource.id);
    }
    return { received: true };
  }
}
