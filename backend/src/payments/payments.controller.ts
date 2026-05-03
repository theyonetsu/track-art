import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post('webhook')
  async webhook(@Body() body: any) {
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      await this.svc.confirmPayment(body.resource.id);
    }
    return { received: true };
  }
}
