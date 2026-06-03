import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { TokenType } from '../common/enums/domain.enums';
import { Token } from '../tokens.model';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
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

    return this.issueTokens(user.id, user.email);
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

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });
      await this.requireActiveRefreshToken(payload.sub, refreshToken);

      await this.revokeRefreshToken(payload.sub, refreshToken);

      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });

      await this.revokeRefreshToken(payload.sub, refreshToken);
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
        expiresIn: '15m',
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        expiresIn: '30d',
      },
    );

    await this.tokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash: await bcrypt.hash(refreshToken, 10),
      type: TokenType.REFRESH,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  private async requireActiveRefreshToken(userId: string, refreshToken: string) {
    const tokens = await this.tokenModel
      .find({
        userId,
        type: TokenType.REFRESH,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    for (const token of tokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        return token;
      }
    }

    throw new UnauthorizedException('Refresh token was revoked');
  }

  private async revokeRefreshToken(userId: string, refreshToken: string) {
    const token = await this.requireActiveRefreshToken(userId, refreshToken);
    token.revokedAt = new Date();
    await token.save();
  }
}
