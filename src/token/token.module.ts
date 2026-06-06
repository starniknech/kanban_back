import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema } from './token.model';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule.register({}), MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
