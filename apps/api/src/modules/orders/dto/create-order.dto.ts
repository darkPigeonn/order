import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { PICKUP_METHOD_VALUES, PickupMethod } from "../../../common/enums/pickup-method.enum";

export class CreateOrderItemDto {
  @IsMongoId()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsMongoId()
  storeId!: string;

  @Transform(({ value }) => plainToInstance(CreateOrderItemDto, parseJsonArray(value)))
  @Type(() => CreateOrderItemDto)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  items!: CreateOrderItemDto[];

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  customerOrderNumber!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  recipientName!: string;

  @IsIn(PICKUP_METHOD_VALUES)
  pickupMethod!: PickupMethod;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  traderName!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null || value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  orderAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

function parseJsonArray(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
