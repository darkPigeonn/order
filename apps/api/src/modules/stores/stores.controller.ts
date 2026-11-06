import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Permission } from "../../common/enums/permission.enum";
import { CreateStoreDto } from "./dto/create-store.dto";
import { ListStoresQuery } from "./dto/list-stores.query";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoresService } from "./stores.service";

@Controller("stores")
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @RequirePermissions(Permission.STORE_READ)
  list(@Query() query: ListStoresQuery) {
    return this.storesService.list(query);
  }

  @Get(":id")
  @RequirePermissions(Permission.STORE_READ)
  findOne(@Param("id") id: string) {
    return this.storesService.findById(id);
  }

  @Post()
  @RequirePermissions(Permission.STORE_WRITE)
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions(Permission.STORE_WRITE)
  update(@Param("id") id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions(Permission.STORE_WRITE)
  remove(@Param("id") id: string) {
    return this.storesService.remove(id);
  }
}
