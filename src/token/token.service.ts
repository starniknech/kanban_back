import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { TokenType } from '../common/enums/domain.enums';
import { toObjectId } from '../common/utils/object-id';
import { Token } from './token.model';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
  ) {}

  async issueTokens(userId: string, email: string) {
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
      userId: toObjectId(userId),
      tokenHash: await bcrypt.hash(refreshToken, 10),
      type: TokenType.REFRESH,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.revokeRefreshToken(payload.sub, refreshToken);

      return this.issueTokens(payload.sub, payload.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.revokeRefreshToken(payload.sub, refreshToken);
    } catch {
      return { success: true };
    }

    return { success: true };
  }

  private verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    });
  }

  private async requireActiveRefreshToken(userId: string, refreshToken: string) {
    const tokens = await this.tokenModel
      .find({
        userId: toObjectId(userId),
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
