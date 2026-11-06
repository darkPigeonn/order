import { IsEnum, IsMongoId, IsOptional } from "class-validator";
import { ListQuery } from "../../../common/dto/list.query";
import { OrderStatus } from "../../../common/enums/order-status.enum";

export class ListOrdersQuery extends ListQuery {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsMongoId()
  storeId?: string;
}
