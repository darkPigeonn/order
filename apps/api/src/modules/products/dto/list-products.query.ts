import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional } from "class-validator";
import { ListQuery } from "../../../common/dto/list.query";

export class ListProductsQuery extends ListQuery {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsIn(["active", "inactive"])
  active?: "active" | "inactive";
}
