import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Product, ProductSchema } from "../modules/products/schemas/product.schema";
import { Stock, StockSchema } from "../modules/stock/schemas/stock.schema";
import { Store, StoreSchema } from "../modules/stores/schemas/store.schema";
import { UsersModule } from "../modules/users/users.module";
import { SeedService } from "./seed.service";

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Stock.name, schema: StockSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
