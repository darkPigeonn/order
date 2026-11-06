import { IsIn, IsOptional } from "class-validator";
import { ListQuery } from "../../../common/dto/list.query";

export class ListNotificationsQuery extends ListQuery {
  @IsOptional()
  @IsIn(["unread", "read"])
  read?: "unread" | "read";
}
