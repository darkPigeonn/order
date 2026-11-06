import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Permission } from "../../common/enums/permission.enum";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQuery } from "./dto/list-users.query";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.USER_READ)
  list(@Query() query: ListUsersQuery) {
    return this.usersService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.USER_WRITE)
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.create(dto, actor);
  }

  @Patch(":id")
  @RequirePermissions(Permission.USER_WRITE)
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, actor);
  }
}
