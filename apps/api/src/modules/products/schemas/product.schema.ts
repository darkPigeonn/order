import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, collection: "products" })
export class Product {
  @Prop({ required: true, trim: true, type: String })
  name!: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, type: String })
  sku!: string;

  @Prop({ trim: true, default: "", type: String })
  description!: string;

  @Prop({ default: true, type: Boolean })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
