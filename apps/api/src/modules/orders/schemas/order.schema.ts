import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import { OrderStatus } from "../../../common/enums/order-status.enum";
import { PickupMethod } from "../../../common/enums/pickup-method.enum";

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Product", required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, trim: true, type: String })
  productName!: string;

  @Prop({ required: true, trim: true, type: String })
  sku!: string;

  @Prop({ required: true, min: 1, type: Number })
  quantity!: number;
}

@Schema({ _id: false })
class BarcodeAttachment {
  @Prop({ required: true, type: String })
  originalName!: string;

  @Prop({ required: true, type: String })
  storedName!: string;

  @Prop({ required: true, type: String })
  mimeType!: string;

  @Prop({ required: true, type: Number })
  size!: number;

  @Prop({ required: true, type: String })
  url!: string;
}

@Schema({ _id: false })
class OrderFinance {
  @Prop({ required: true, min: 0, type: Number })
  fee!: number;

  @Prop({ required: true, min: 0, type: Number })
  sellingPrice!: number;

  @Prop({ default: "", type: String })
  note!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  recordedBy!: Types.ObjectId;

  @Prop({ required: true, type: Date })
  recordedAt!: Date;
}

@Schema({ _id: false })
class StatusEvent {
  @Prop({ required: true, enum: OrderStatus, type: String })
  status!: OrderStatus;

  @Prop({ required: true, type: Date })
  at!: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true })
  by!: Types.ObjectId;

  @Prop({ default: "", type: String })
  note!: string;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
const BarcodeAttachmentSchema = SchemaFactory.createForClass(BarcodeAttachment);
const OrderFinanceSchema = SchemaFactory.createForClass(OrderFinance);
const StatusEventSchema = SchemaFactory.createForClass(StatusEvent);

@Schema({ timestamps: true, collection: "orders" })
export class Order {
  @Prop({ required: true, unique: true, type: String })
  orderNumber!: string;

  @Prop({ default: "", trim: true, type: String })
  customerOrderNumber!: string;

  @Prop({ default: "", trim: true, type: String })
  recipientName!: string;

  @Prop({ enum: PickupMethod, type: String, default: PickupMethod.SELF_PICK_UP })
  pickupMethod!: PickupMethod;

  @Prop({ default: "", trim: true, type: String })
  traderName!: string;

  @Prop({ type: Number, default: null })
  orderAmount!: number | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Store", required: true, index: true })
  storeId!: Types.ObjectId;

  @Prop({
    required: true,
    enum: OrderStatus,
    type: String,
    default: OrderStatus.PENDING_PICKUP,
    index: true,
  })
  status!: OrderStatus;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ type: [BarcodeAttachmentSchema], default: [] })
  barcodes!: BarcodeAttachment[];

  @Prop({ default: "", type: String })
  note!: string;

  @Prop({ type: OrderFinanceSchema, default: null })
  finance!: OrderFinance | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  pickedUpBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  pickedUpAt!: Date | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User", default: null })
  completedBy!: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;

  @Prop({ type: [StatusEventSchema], default: [] })
  history!: StatusEvent[];

  createdAt!: Date;
  updatedAt!: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ createdAt: -1 });
