import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { ApiResponseDto } from 'src/dto/api-response.dto';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { Jwtdto } from './dto/jwt.dto';
import { ConfigService } from '@nestjs/config';
import { userInclude } from './includes/user.include';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(user: RegisterUserDto): Promise<ApiResponseDto<unknown>> {
    const rounds = parseInt(await this.configService.get('SALT_ROUNDS'));
    if (
      await this.prismaService.user.findFirst({
        where: {
          email: user.email,
        },
      })
    ) {
      throw new ForbiddenException('user.already.exists');
    }

    // get rounds from config!!

    const passwordSalt = await bcrypt.genSalt(rounds);

    const hashedPassword = await bcrypt.hash(user.password, passwordSalt);
    const newUser = await this.prismaService.user.create({
      data: {
        email: user.email,
        username: user.name,
        password: hashedPassword,
      },
      include: userInclude,
    });

    const token = await this.createPayload(newUser);

    return {
      data: {
        user: newUser,
        access_token: token.access_token,
      },
      message: 'user.created',
    };
  }

  async validateUser(loginUser: LoginUserDto): Promise<User> {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: loginUser.email,
      },
      include: userInclude,
    });
    if (!user) {
      throw new NotFoundException('user.doesnt.exists');
    }

    if (!(await bcrypt.compare(loginUser.password, user.password))) {
      throw new UnauthorizedException('invalid.credentials');
    }
    return user;
  }

  async validateUserByEmail(loginUser: Jwtdto): Promise<User> {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: loginUser.email,
      },
      include: userInclude,
    });
    if (!user) {
      throw new NotFoundException('user.doesnt.exists');
    }

    return user;
  }

  async login(user: LoginUserDto): Promise<ApiResponseDto<unknown>> {
    const userRecord = await this.prismaService.user.findFirst({
      where: {
        email: user.email,
      },
      include: userInclude,
    });
    if (!userRecord) {
      throw new BadRequestException('User Not Found');
    }

    const isPasswordCorrect = await bcrypt.compare(
      user.password,
      userRecord.password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Either Password or Email is incorrect!');
    }

    const token = await this.createPayload(userRecord);
    return {
      data: {
        user: userRecord,
        access_token: token.access_token,
      },
      message: 'login.success',
    };
  }

  async refreshToken(user: User): Promise<ApiResponseDto<unknown>> {
    const token = await this.createPayload(user);
    return {
      data: {
        user,
        access_token: token.access_token,
      },
      message: 'login.success',
    };
  }

  async createPayload(user: User) {
    return {
      access_token: this.jwtService.sign({ email: user.email, id: user.id }),
    };
  }
}
