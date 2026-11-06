import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ collection: "sequences" })
export class Sequence {
  @Prop({ required: true, unique: true, type: String })
  key!: string;

  @Prop({ required: true, default: 0, type: Number })
  value!: number;
}

export type SequenceDocument = HydratedDocument<Sequence>;
export const SequenceSchema = SchemaFactory.createForClass(Sequence);
