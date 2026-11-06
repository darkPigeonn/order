import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Permission } from "../../common/enums/permission.enum";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsQuery } from "./dto/list-products.query";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions(Permission.PRODUCT_READ)
  list(@Query() query: ListProductsQuery) {
    return this.productsService.list(query);
  }

  @Post()
  @RequirePermissions(Permission.PRODUCT_WRITE)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions(Permission.PRODUCT_WRITE)
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions(Permission.PRODUCT_WRITE)
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
