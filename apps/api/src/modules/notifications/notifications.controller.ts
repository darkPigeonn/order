import { Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { ListNotificationsQuery } from "./dto/list-notifications.query";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Query() query: ListNotificationsQuery, @CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.list(actor, query);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.unreadCount(actor);
  }

  @Post("read-all")
  markAllRead(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.markAllRead(actor);
  }

  @Post(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.markRead(id, actor);
  }
}
