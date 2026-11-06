import { IsOptional, IsString, MaxLength } from "class-validator";

export class PickupOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
