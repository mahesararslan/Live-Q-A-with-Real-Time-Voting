import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { AuthJwtPayload } from '../types/auth-jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload) {
    const { userId } = payload.sub;
    console.log("user with ID:", payload.sub);

    const jwtUser = await this.authService.validateJwtUser(userId);

    console.log("Validated JWT user:", jwtUser);
    return jwtUser; // whatever the name here but it will be appended to req.user obj
  }
}

// req.user
