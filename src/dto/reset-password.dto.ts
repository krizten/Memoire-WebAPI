import { MinLength, IsNotEmpty } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export class ResetPasswordDTO {
  @ApiModelProperty({
    description: `user's new password`,
    minLength: 6,
  })
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;

  @ApiModelProperty({
    description: `confirm new password`,
    minLength: 6,
  })
  @MinLength(6)
  @IsNotEmpty()
  confirmPassword: string;
}