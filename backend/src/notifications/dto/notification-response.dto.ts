import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Notification } from '@prisma/client';

/** Notification interne exposée au destinataire. */
export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: "Type de transition à l'origine du message (ex. EVENT_UPDATED)." })
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ enum: ['UNREAD', 'READ'] })
  status!: string;

  @ApiPropertyOptional({ nullable: true, description: 'Event de rebond (fiche), si applicable.' })
  eventId!: string | null;

  @ApiProperty({ description: 'ISO 8601, UTC.' })
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true, description: 'ISO 8601, UTC.' })
  readAt!: string | null;

  static from(notification: Notification): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      status: notification.status,
      eventId: notification.eventId,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
    };
  }
}

/** Nombre de notifications non lues (badge). */
export class UnreadCountDto {
  @ApiProperty()
  count!: number;
}
