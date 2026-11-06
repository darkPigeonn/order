import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { escapeRegex, resolveSort } from "../../common/utils/sort-query";
import { Role } from "../../common/enums/role.enum";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { buildPageMeta } from "../../common/interfaces/paginated";
import { UsersService } from "../users/users.service";
import { ListNotificationsQuery } from "./dto/list-notifications.query";
import { Notification, NotificationDocument } from "./schemas/notification.schema";

export interface NotificationPayload {
  title: string;
  message: string;
  orderId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    private readonly usersService: UsersService,
  ) {}

  async notifyRoles(roles: Role[], payload: NotificationPayload, excludeUserId?: string) {
    const recipientIds = await this.usersService.findActiveIdsByRoles(roles);
    await this.notifyUsers(recipientIds, payload, excludeUserId);
  }

  async notifyUsers(recipientIds: string[], payload: NotificationPayload, excludeUserId?: string) {
    const uniqueIds = [...new Set(recipientIds)].filter((id) => id && id !== excludeUserId);
    if (uniqueIds.length === 0) {
      return;
    }

    await this.notificationModel.insertMany(
      uniqueIds.map((recipientId) => ({
        recipientId,
        title: payload.title,
        message: payload.message,
        orderId: payload.orderId ?? null,
        readAt: null,
      })),
    );
  }

  async list(actor: AuthenticatedUser, query: ListNotificationsQuery) {
    const filter: FilterQuery<Notification> = { recipientId: new Types.ObjectId(actor.id) };
    if (query.read === "unread") filter.readAt = null;
    if (query.read === "read") filter.readAt = { $ne: null };
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = [{ title: pattern }, { message: pattern }];
    }

    const sort = resolveSort(query.sortBy, query.sortDir, ["createdAt", "title"], {
      field: "createdAt",
      direction: -1,
    });
    const [total, rows] = await Promise.all([
      this.notificationModel.countDocuments(filter),
      this.notificationModel
        .find(filter)
        .sort(sort)
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ]);

    return {
      data: rows.map((row) => this.toResponse(row)),
      meta: buildPageMeta(query.page, query.limit, total),
    };
  }

  async unreadCount(actor: AuthenticatedUser) {
    const total = await this.notificationModel.countDocuments({
      recipientId: actor.id,
      readAt: null,
    });
    return { total };
  }

  async markRead(id: string, actor: AuthenticatedUser) {
    const notification = await this.notificationModel.findOne({ _id: id, recipientId: actor.id });
    if (!notification) {
      throw new NotFoundException("Notifikasi tidak ditemukan");
    }
    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }
    return this.toResponse(notification);
  }

  async markAllRead(actor: AuthenticatedUser) {
    await this.notificationModel.updateMany(
      { recipientId: actor.id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return { updated: true };
  }

  private toResponse(notification: NotificationDocument) {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      orderId: notification.orderId ? String(notification.orderId) : null,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
