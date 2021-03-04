import { config } from 'dotenv';
import {
  Controller,
  UseGuards,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiImplicitFile,
  ApiOperation,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { AuthGuard } from '../shared/auth.guard';
import { UploadService } from './upload.service';

config();

@ApiUseTags('Uploads')
@ApiBearerAuth()
@Controller(`${process.env.BASE_PATH}/uploads`)
@UseGuards(new AuthGuard())
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('/image')
  /***** Swagger API Doc Start *****/
  @ApiOperation({ title: 'Upload Entry Image', description: 'Upload a descriptive image for that entry to Amazon S3 (max size: 200KB)' })
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'image', required: true, description: 'Add image to entry. (Supported MIME types: png, jpeg)' })
  @ApiOkResponse({ description: 'Image upload successfully' })
  @ApiBadRequestResponse({ description: 'Error in request headers or body' })
  @ApiForbiddenResponse({ description: 'Authorization has been denied for this request' })
  @ApiUnprocessableEntityResponse({ description: 'Error occurred while trying to upload image' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  /***** Swagger API Doc End *****/
  imageUpload(@Req() request: any, @Res() response: any) {
    this.uploadService.imageUpload(request, response);
  }

  @Post('/avatar')
  /***** Swagger API Doc Start *****/
  @ApiOperation({ title: 'Upload User Avatar', description: 'Upload a new avatar for the user to Amazon S3 (max size: 200KB)' })
  @ApiConsumes('multipart/form-data')
  @ApiImplicitFile({ name: 'avatar', required: true, description: 'Upload new avatar. (Supported MIME types: png, jpeg)' })
  @ApiOkResponse({ description: 'Avatar upload successfully' })
  @ApiBadRequestResponse({ description: 'Error in request headers or body' })
  @ApiForbiddenResponse({ description: 'Authorization has been denied for this request' })
  @ApiUnprocessableEntityResponse({ description: 'Error occurred while trying to upload avatar' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  /***** Swagger API Doc End *****/
  avatarUpload(@Req() request: any, @Res() response: any) {
    this.uploadService.avatarUpload(request, response);
  }
}
