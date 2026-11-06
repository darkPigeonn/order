import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

@Schema({ timestamps: true, collection: "notifications" })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true, index: true })
  recipientId!: Types.ObjectId;

  @Prop({ required: true, trim: true, type: String })
  title!: string;

  @Prop({ required: true, trim: true, type: String })
  message!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Order", default: null })
  orderId!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
