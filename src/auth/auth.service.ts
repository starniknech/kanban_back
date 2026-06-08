import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TokenService } from '../token/token.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    const email = data.email.toLowerCase();
    const exists = await this.usersService.findByEmail(email);

    if (exists) {
      throw new BadRequestException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      name: data.name,
      email,
      passwordHash,
    });

    return this.tokenService.issueTokens(user.id, user.email);
  }

  async login(data: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenService.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    return this.tokenService.refresh(refreshToken);
  }

  async logout(refreshToken: string) {
    return this.tokenService.logout(refreshToken);
  }
}
