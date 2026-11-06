import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Permission } from "../../common/enums/permission.enum";
import { ListStockQuery } from "./dto/list-stock.query";
import { UpsertStockDto } from "./dto/upsert-stock.dto";
import { StockService } from "./stock.service";

@Controller("stock")
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @RequirePermissions(Permission.STOCK_READ)
  list(@Query() query: ListStockQuery) {
    return this.stockService.listByStore(query);
  }

  @Put()
  @RequirePermissions(Permission.STOCK_WRITE)
  upsert(@Body() dto: UpsertStockDto) {
    return this.stockService.upsert(dto);
  }
}
