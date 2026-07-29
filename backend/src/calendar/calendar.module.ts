import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CalendarController } from './controllers/calendar.controller';
import { EventCoversModule } from '../event-covers/event-covers.module';

/**
 * Mon calendrier (FSPEC.05) : projection personnelle des Events ayant une participation.
 * S'appuie sur EventsService.getCalendar.
 */
@Module({
  imports: [EventsModule, EventCoversModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
