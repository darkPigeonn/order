import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { permissionsFor } from "../../common/auth/role-permissions";
import { AuthenticatedUser } from "../../common/interfaces/authenticated-user";
import { UsersService } from "../users/users.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Email atau kata sandi salah");
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Email atau kata sandi salah");
    }

    const profile = this.toProfile(user.id, user.name, user.email, user.role);
    return this.issue(profile);
  }

  changePassword(actor: AuthenticatedUser, dto: ChangePasswordDto) {
    return this.usersService.changePassword(actor, dto.currentPassword, dto.newPassword);
  }

  me(user: AuthenticatedUser) {
    return {
      user,
      permissions: permissionsFor(user.role),
    };
  }

  private issue(user: AuthenticatedUser) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user,
      permissions: permissionsFor(user.role),
    };
  }

  private toProfile(
    id: string,
    name: string,
    email: string,
    role: AuthenticatedUser["role"],
  ): AuthenticatedUser {
    return { id, name, email, role };
  }
}
