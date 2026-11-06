import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import { FilterQuery, Model } from "mongoose";
import { Role } from "../../common/enums/role.enum";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { buildPageMeta, Paginated } from "../../common/interfaces/paginated";
import { escapeRegex, resolveSort } from "../../common/utils/sort-query";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQuery } from "./dto/list-users.query";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, UserDocument } from "./schemas/user.schema";
import { toUserResponse, UserResponse } from "./user.presenter";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(dto: CreateUserDto, actor?: AuthenticatedUser): Promise<UserResponse> {
    if (actor) {
      this.assertCanAssignRole(actor, dto.role);
    }

    const email = dto.email.toLowerCase().trim();
    const existing = await this.userModel.exists({ email });
    if (existing) {
      throw new ConflictException("Email sudah terdaftar");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userModel.create({
      name: dto.name.trim(),
      email,
      passwordHash,
      role: dto.role,
      isActive: dto.isActive ?? true,
    });

    return toUserResponse(user);
  }

  async list(query: ListUsersQuery): Promise<Paginated<UserResponse>> {
    const filter: FilterQuery<User> = {};
    if (query.role) filter.role = query.role;
    if (query.active === "active") filter.isActive = true;
    if (query.active === "inactive") filter.isActive = false;
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q.trim()), "i");
      filter.$or = [{ name: pattern }, { email: pattern }];
    }

    const [total, rows] = await Promise.all([
      this.userModel.countDocuments(filter),
      this.userModel
        .find(filter)
        .sort(resolveSort(query.sortBy, query.sortDir, ["name", "email", "role", "createdAt"], { field: "createdAt", direction: -1 }))
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
    ]);

    return {
      data: rows.map((row) => toUserResponse(row)),
      meta: buildPageMeta(query.page, query.limit, total),
    };
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthenticatedUser): Promise<UserResponse> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException("Pengguna tidak ditemukan");
    }

    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Akun Super Admin hanya dapat diubah oleh Super Admin");
    }

    if (dto.role) {
      this.assertCanAssignRole(actor, dto.role);
    }

    if (user.id === actor.id && dto.isActive === false) {
      throw new BadRequestException("Anda tidak dapat menonaktifkan akun sendiri");
    }

    if (dto.name) {
      user.name = dto.name.trim();
    }
    if (dto.role) {
      user.role = dto.role;
    }
    if (typeof dto.isActive === "boolean") {
      user.isActive = dto.isActive;
    }
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    await user.save();
    return toUserResponse(user);
  }

  async findActiveIdsByRoles(roles: Role[]): Promise<string[]> {
    const rows = await this.userModel.find({ role: { $in: roles }, isActive: true }).select("_id");
    return rows.map((row) => row.id);
  }

  async changePassword(actor: AuthenticatedUser, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(actor.id).select("+passwordHash");
    if (!user || !user.isActive) {
      throw new NotFoundException("Pengguna tidak ditemukan");
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException("Kata sandi sekarang tidak sesuai");
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();
    return { updated: true };
  }

  async findActiveById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ _id: id, isActive: true });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  }

  private assertCanAssignRole(actor: AuthenticatedUser, role: Role) {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (actor.role === Role.ADMIN && (role === Role.SUB_ADMIN || role === Role.USER)) {
      return;
    }

    throw new ForbiddenException("Anda tidak dapat menetapkan peran tersebut");
  }
}

