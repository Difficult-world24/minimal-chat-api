import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth-guard';
import { AuthUser } from 'src/decorators/authUser';
import { User } from '@prisma/client';
import { ApiResponseDto } from 'src/dto/api-response.dto';
import { AddFriendDTO } from './dto/add.friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendService: FriendsService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(
    @AuthUser() user: User,
    @Query('username') username: string,
  ): Promise<ApiResponseDto<User[]>> {
    return await this.friendService.search(user, username);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async addFriend(@AuthUser() user: User, @Body() addFriendDTO: AddFriendDTO) {
    return await this.friendService.addFriend(user, addFriendDTO);
  }
}
