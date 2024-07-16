import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddFriendDTO {
  @IsNotEmpty()
  @IsNumber()
  friendId: number;
}
