import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { MailboxService } from './mailbox.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMailboxDto,
  ListMailboxesQueryDto,
  ListEmailsQueryDto,
  ExtendExpiryDto,
} from './dto';
import { ICurrentUserData } from 'src/common/interfaces';

@Controller('mailboxes')
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}

  @Post()
  async createMailbox(
    @CurrentUser() user: ICurrentUserData,
    @Body() dto: CreateMailboxDto,
  ) {
    return this.mailboxService.createMailbox({
      userId: user.userId,
      customName: dto.customName,
      domain: dto.domain,
      ttlMinutes: dto.ttlMinutes,
    });
  }

  @Get()
  async listMailboxes(
    @CurrentUser() user: ICurrentUserData,
    @Query() query: ListMailboxesQueryDto,
  ) {
    return this.mailboxService.listMailboxes({
      userId: user.userId,
      limit: query.limit,
      offset: query.offset,
      includeExpired: query.includeExpired,
    });
  }

  @Get(':mailboxId')
  async getMailbox(
    @CurrentUser() user: ICurrentUserData,
    @Param('mailboxId') mailboxId: string,
  ) {
    return this.mailboxService.getMailbox({
      mailboxId,
      userId: user.userId,
    });
  }

  @Delete(':mailboxId')
  async deleteMailbox(
    @CurrentUser() user: ICurrentUserData,
    @Param('mailboxId') mailboxId: string,
  ) {
    return this.mailboxService.deleteMailbox({
      mailboxId,
      userId: user.userId,
    });
  }

  @Patch(':mailboxId/extend')
  async extendExpiry(
    @CurrentUser() user: ICurrentUserData,
    @Param('mailboxId') mailboxId: string,
    @Body() dto: ExtendExpiryDto,
  ) {
    return this.mailboxService.extendExpiry({
      mailboxId,
      userId: user.userId,
      additionalMinutes: dto.additionalMinutes,
    });
  }

  @Get(':mailboxId/emails')
  async listEmails(
    @CurrentUser() user: ICurrentUserData,
    @Param('mailboxId') mailboxId: string,
    @Query() query: ListEmailsQueryDto,
  ) {
    return this.mailboxService.listEmails({
      mailboxId,
      userId: user.userId,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get(':mailboxId/emails/:emailId')
  async getEmail(
    @CurrentUser() user: ICurrentUserData,
    @Param('emailId') emailId: string,
  ) {
    return this.mailboxService.getEmail({
      emailId,
      userId: user.userId,
    });
  }

  @Delete(':mailboxId/emails/:emailId')
  async deleteEmail(
    @CurrentUser() user: ICurrentUserData,
    @Param('emailId') emailId: string,
  ) {
    return this.mailboxService.deleteEmail({
      emailId,
      userId: user.userId,
    });
  }

  @Patch(':mailboxId/emails/:emailId/read')
  async markEmailRead(
    @CurrentUser() user: ICurrentUserData,
    @Param('emailId') emailId: string,
  ) {
    return this.mailboxService.markEmailRead({
      emailId,
      userId: user.userId,
    });
  }
}
