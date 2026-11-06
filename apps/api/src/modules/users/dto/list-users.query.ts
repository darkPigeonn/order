import { IsEnum, IsIn, IsOptional } from "class-validator";
import { ListQuery } from "../../../common/dto/list.query";
import { Role } from "../../../common/enums/role.enum";

export class ListUsersQuery extends ListQuery {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsIn(["active", "inactive"])
  active?: "active" | "inactive";
}
