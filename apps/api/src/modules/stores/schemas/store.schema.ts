import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, collection: "stores" })
export class Store {
  @Prop({ required: true, trim: true, type: String })
  name!: string;

  @Prop({ trim: true, default: "", type: String })
  address!: string;

  @Prop({ trim: true, default: "", type: String })
  phone!: string;

  @Prop({ required: true, default: false, type: Boolean })
  requireBarcode!: boolean;

  @Prop({ trim: true, default: "", type: String })
  notes!: string;

  @Prop({ default: true, type: Boolean })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type StoreDocument = HydratedDocument<Store>;
export const StoreSchema = SchemaFactory.createForClass(Store);
StoreSchema.index({ name: 1 });
