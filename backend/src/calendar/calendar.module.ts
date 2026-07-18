import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CalendarController } from './controllers/calendar.controller';

/**
 * Mon calendrier (FSPEC.05) : projection personnelle des Events ayant une participation.
 * S'appuie sur EventsService.getCalendar.
 */
@Module({
  imports: [EventsModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
