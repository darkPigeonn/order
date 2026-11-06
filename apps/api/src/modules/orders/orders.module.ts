import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProductsModule } from "../products/products.module";
import { StockModule } from "../stock/stock.module";
import { StoresModule } from "../stores/stores.module";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { Order, OrderSchema } from "./schemas/order.schema";
import { Sequence, SequenceSchema } from "./schemas/sequence.schema";
import { SequenceService } from "./sequence.service";

@Module({
  imports: [
    StoresModule,
    ProductsModule,
    StockModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Sequence.name, schema: SequenceSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, SequenceService],
})
export class OrdersModule {}
