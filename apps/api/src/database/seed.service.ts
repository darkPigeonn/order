import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Role } from "../common/enums/role.enum";
import { Product } from "../modules/products/schemas/product.schema";
import { Stock } from "../modules/stock/schemas/stock.schema";
import { Store } from "../modules/stores/schemas/store.schema";
import { UsersService } from "../modules/users/users.service";

const DEMO_PASSWORD = "Admin123!";

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectModel(Store.name) private readonly storeModel: Model<Store>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
  ) {}

  async onModuleInit() {
    if (!this.configService.get<boolean>("seedOnBoot")) {
      return;
    }
    await this.run();
  }

  async run() {
    await this.ensureUser("Super Admin", "superadmin@manageorder.local", Role.SUPER_ADMIN);
    await this.ensureUser("Admin Toko", "admin@manageorder.local", Role.ADMIN);
    await this.ensureUser("Tim Lapangan", "lapangan@manageorder.local", Role.SUB_ADMIN);
    await this.ensureUser("Mitra Pesanan", "mitra@manageorder.local", Role.USER);

    const studio = await this.ensureStore({
      name: "Studio Ponsel",
      address: "Ruko Melati No. 12",
      phone: "081200000001",
      requireBarcode: true,
      notes: "Wajib lampirkan barcode saat membuat pesanan.",
    });
    const sumber = await this.ensureStore({
      name: "Toko Sumber Rejeki",
      address: "Jl. Kenanga No. 8",
      phone: "081200000002",
      requireBarcode: false,
      notes: "",
    });

    const casing = await this.ensureProduct("Casing Premium", "CAS-001", "Casing ponsel");
    const antigores = await this.ensureProduct("Antigores", "ANT-002", "Antigores bening");
    const charger = await this.ensureProduct("Charger", "CHG-003", "Charger USB");

    for (const store of [studio, sumber]) {
      await this.ensureStock(store.id, casing.id, 20);
      await this.ensureStock(store.id, antigores.id, 30);
      await this.ensureStock(store.id, charger.id, 15);
    }

    this.logger.log("Data awal siap. Kata sandi akun demo: Admin123!");
  }

  private async ensureUser(name: string, email: string, role: Role) {
    try {
      await this.usersService.create({ name, email, password: DEMO_PASSWORD, role });
    } catch (error) {
      if (error instanceof Error && error.message === "Email sudah terdaftar") {
        return;
      }
      const status = typeof error === "object" && error && "status" in error ? error.status : undefined;
      if (status === 409) {
        return;
      }
      throw error;
    }
  }

  private async ensureStore(input: {
    name: string;
    address: string;
    phone: string;
    requireBarcode: boolean;
    notes: string;
  }) {
    const existing = await this.storeModel.findOne({ name: input.name });
    if (existing) {
      return existing;
    }
    return this.storeModel.create(input);
  }

  private async ensureProduct(name: string, sku: string, description: string) {
    const existing = await this.productModel.findOne({ sku });
    if (existing) {
      return existing;
    }
    return this.productModel.create({ name, sku, description, isActive: true });
  }

  private async ensureStock(storeId: string, productId: string, quantity: number) {
    const existing = await this.stockModel.findOne({ storeId, productId });
    if (existing) {
      return existing;
    }
    return this.stockModel.create({ storeId, productId, quantity });
  }
}
