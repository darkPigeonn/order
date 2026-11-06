import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Role } from "../../../common/enums/role.enum";

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, trim: true, type: String })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, type: String })
  email!: string;

  @Prop({ required: true, select: false, type: String })
  passwordHash!: string;

  @Prop({ required: true, enum: Role, type: String })
  role!: Role;

  @Prop({ default: true, type: Boolean })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
