import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash, verify } from 'argon2';
import { User } from 'src/entities/user.entity';
import { CreateUserInput } from 'src/user/dto/create-user.input';
import { Repository } from 'typeorm';
import { SignInInput } from './dto/signIn.input';
import { AuthJwtPayload } from './types/auth-jwt-payload';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload } from './entities/auth-payload';
import { JwtUser } from './types/jwt-user';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async registerUser(input: CreateUserInput) {
    const hashedPassword = await hash(input.password);
    const newUser = this.userRepo.create({
      ...input,
      password: hashedPassword,
    });
    return await this.userRepo.save(newUser);
  }

  async validateLocalUser({ email, password }: SignInInput) {
    const user = await this.userRepo.findOneByOrFail({ email });

    const passwordMatched = await verify(user.password, password);

    if (!passwordMatched)
      throw new UnauthorizedException('Invalid Credentials');

    return user;
  }

  async generateToken(userId: number) {
    const payload: AuthJwtPayload = {
      sub: {
        userId,
      },
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async login(user: User): Promise<AuthPayload> {
    const { accessToken } = await this.generateToken(user.id);

    return {
      userId: user.id,
      token: accessToken,
    };
  }

  async validateJwtUser(userId: number) {
    const user = await this.userRepo.findOneByOrFail({ id: userId });
    const jwtUser: JwtUser = {
      userId: user.id,
    };
    return jwtUser;
  }

  async validateGoogleUser(googleUser: CreateUserInput) {
        const user = await this.userRepo.findOne({ where: { email: googleUser.email } });
        if (!user) {
            // If user does not exist, create a new user
            const newUser = this.userRepo.create(googleUser);
            await this.userRepo.save(newUser);
            return newUser;
        }
        // If user exists, return the user
        return user;
    }
}
