import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQuery } from "./pagination.query";

export class ListQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sortBy?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir?: "asc" | "desc";
}
