import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { unlink } from "fs/promises";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  RequireAnyPermission,
  RequirePermissions,
} from "../../common/decorators/permissions.decorator";
import { Permission } from "../../common/enums/permission.enum";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ListOrdersQuery } from "./dto/list-orders.query";
import { PickupOrderDto } from "./dto/pickup-order.dto";
import { RecordFinanceDto } from "./dto/record-finance.dto";
import { OrdersService } from "./orders.service";
import { barcodeUploadOptions } from "./uploads/barcode-upload";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("summary")
  @RequireAnyPermission(Permission.ORDER_READ_OWN, Permission.ORDER_READ_ALL)
  summary(@CurrentUser() actor: AuthenticatedUser) {
    return this.ordersService.summary(actor);
  }

  @Get()
  @RequireAnyPermission(Permission.ORDER_READ_OWN, Permission.ORDER_READ_ALL)
  list(@Query() query: ListOrdersQuery, @CurrentUser() actor: AuthenticatedUser) {
    return this.ordersService.list(query, actor);
  }

  @Get(":id")
  @RequireAnyPermission(Permission.ORDER_READ_OWN, Permission.ORDER_READ_ALL)
  findOne(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.ordersService.findOne(id, actor);
  }

  @Post()
  @RequirePermissions(Permission.ORDER_CREATE)
  @UseInterceptors(FilesInterceptor("barcodes", 5, barcodeUploadOptions))
  async create(
    @Body() dto: CreateOrderDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    try {
      return await this.ordersService.create(dto, files ?? [], actor);
    } catch (error) {
      await Promise.all((files ?? []).map((file) => unlink(file.path).catch(() => undefined)));
      throw error;
    }
  }

  @Post(":id/pickup")
  @RequirePermissions(Permission.ORDER_PICKUP)
  pickup(
    @Param("id") id: string,
    @Body() dto: PickupOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ordersService.pickup(id, dto, actor);
  }

  @Put(":id/finance")
  @RequirePermissions(Permission.ORDER_FINANCE)
  recordFinance(
    @Param("id") id: string,
    @Body() dto: RecordFinanceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ordersService.recordFinance(id, dto, actor);
  }

  @Post(":id/complete")
  @RequirePermissions(Permission.ORDER_COMPLETE)
  complete(@Param("id") id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.ordersService.complete(id, actor);
  }
}
