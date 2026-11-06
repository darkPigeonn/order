import { IsIn, IsMongoId, IsOptional } from "class-validator";
import { ListQuery } from "../../../common/dto/list.query";

export class ListStockQuery extends ListQuery {
  @IsMongoId()
  storeId!: string;

  @IsOptional()
  @IsIn(["active", "inactive"])
  active?: "active" | "inactive";
}
