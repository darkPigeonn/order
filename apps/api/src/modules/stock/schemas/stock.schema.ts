import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

@Schema({ timestamps: true, collection: "stocks" })
export class Stock {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Store", required: true, index: true })
  storeId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Product", required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, min: 0, default: 0, type: Number })
  quantity!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export type StockDocument = HydratedDocument<Stock>;
export const StockSchema = SchemaFactory.createForClass(Stock);
StockSchema.index({ storeId: 1, productId: 1 }, { unique: true });
