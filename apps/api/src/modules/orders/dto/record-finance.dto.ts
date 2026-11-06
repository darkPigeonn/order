import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class RecordFinanceDto {
  @IsInt()
  @Min(0)
  fee!: number;

  @IsInt()
  @Min(0)
  sellingPrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
