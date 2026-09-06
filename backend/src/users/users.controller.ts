import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SuperAdminGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@Req() req) { return this.users.me(req.user.sub); }

  @Patch('me')
  updateMe(@Req() req, @Body() body: Record<string, unknown>) { return this.users.updateMe(req.user.sub, body); }

  @UseGuards(SuperAdminGuard)
  @Get('admin/users')
  listAll() { return this.users.listAll(); }

  /** Tableau de bord plateforme : agrégats, séries 30 jours, détail par photographe */
  @UseGuards(SuperAdminGuard)
  @Get('admin/stats')
  stats() { return this.users.platformStats(); }
}
