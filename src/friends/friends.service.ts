import { BadRequestException, Injectable } from '@nestjs/common';
import { Friends, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddFriendDTO } from './dto/add.friend.dto';
import { ApiResponseDto } from 'src/dto/api-response.dto';

@Injectable()
export class FriendsService {
  constructor(private readonly prismaService: PrismaService) {}

  async search(user: User, username: string): Promise<ApiResponseDto<User[]>> {
    const results = await this.prismaService.user.findMany({
      distinct: ['username', 'email'],
      where: {
        OR: [
          {
            username: {
              contains: username,
            },
          },
          {
            email: {
              contains: username,
            },
          },
        ],
      },
    });

    const mappedResults = await Promise.all(
      results.map(async (result) => {
        const alreadyFriends = await this.checkIfFriends(user.id, result.id);
        return {
          ...result,
          alreadyFriends,
        };
      }),
    );

    return {
      message: '',
      data: mappedResults,
    };
  }
  private async checkIfFriends(userId: number, friendId: number) {
    //
    const record = await this.prismaService.friends.findFirst({
      where: {
        AND: [
          {
            userId,
          },
          {
            friendId,
          },
        ],
      },
    });
    return record ? true : false;
  }
  async addFriend(
    user: User,
    data: AddFriendDTO,
  ): Promise<ApiResponseDto<Friends>> {
    //
    const checkFriendRecord = await this.prismaService.friends.findFirst({
      where: {
        userId: user.id,
        friendId: data.friendId,
      },
    });
    if (checkFriendRecord) {
      throw new BadRequestException('Friend Already Exists');
    }
    const newFriend = await this.prismaService.friends.create({
      data: {
        userId: user.id,
        friendId: data.friendId,
      },
    });
    return {
      message: 'Friend Added!',
      data: newFriend,
    };
  }
}
