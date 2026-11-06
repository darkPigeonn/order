import { IsInt, IsMongoId, Min } from "class-validator";

export class UpsertStockDto {
  @IsMongoId()
  storeId!: string;

  @IsMongoId()
  productId!: string;

  @IsInt()
  @Min(0)
  quantity!: number;
}
