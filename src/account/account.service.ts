import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Repository, getConnection } from 'typeorm';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

import { UserEntity } from '../auth/user.entity';
import { LogoutTokenEntity } from '../auth/logout-token.entity';
import { EntryEntity } from '../entry/entry.entity';
import { IResponse } from '../interfaces/response.interface';
import { AccountDTO } from '../dto/account.dto';
import { PasswordDTO } from '../dto/password.dto';

interface ResponseOptions {
  summary: string;
  user?: UserEntity;
  status?: number;
  showToken?: boolean;
  account?: boolean;
}

@Injectable()
export class AccountService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<UserEntity>,
    @Inject('ENTRY_REPOSITORY')
    private entryRepository: Repository<EntryEntity>,
  ) {}

  // get token
  private token(id: string, email: string, duration: string): string {
    return jwt.sign({ id, email }, process.env.SECRET, { expiresIn: duration });
  }

  // confirm password
  private async checkPassword(attempt: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(attempt, hash);
  }

  // format response to standard in specfications
  private responseFormat({
    summary,
    user,
    status = HttpStatus.OK,
    showToken = false,
    account = false,
  }: ResponseOptions): IResponse {
    if (user) {
      const {
        id,
        created,
        email,
        avatar,
        bio,
        gender,
        dateOfBirth,
        entries,
        name,
      } = user;
      const token = this.token(id, email, '7d');
      let data: any = { id, created, email };

      if (showToken) {
        data = { ...data, ...{ token } };
      }

      if (account) {
        data = {
          name,
          email,
          dateOfBirth,
          gender,
          avatar,
          bio,
          entriesTillDate: entries.length,
        };
      }

      return {
        summary,
        success: true,
        status,
        data,
      };
    }

    return {
      summary,
      success: true,
      status: HttpStatus.OK,
    };
  }

  async getAccount(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['entries'],
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }
    return this.responseFormat({
      summary: 'Request was successful.',
      user,
      account: true,
    });
  }

  async updateAccount(
    userId: string,
    data: Partial<AccountDTO>,
  ): Promise<IResponse> {
    let user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['entries'],
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }
    await this.userRepository.update({ id: userId }, data);
    user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['entries'],
    });
    return this.responseFormat({
      summary: 'User details updated successfully.',
      user,
      account: true,
    });
  }

  async deleteAccount(
    request: Request,
    userId: string,
    data: PasswordDTO,
  ): Promise<IResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    const { password } = data;
    const passwordMatch = await this.checkPassword(password, user.password);
    if (!passwordMatch) {
      throw new HttpException('Password is incorrect', HttpStatus.BAD_REQUEST);
    }

    await this.entryRepository.delete({ author: user });
    await this.userRepository.delete({ id: userId });

    const bearerToken: any = request.headers.authorization.split(' ')[1];

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(LogoutTokenEntity)
      .values({ token: bearerToken })
      .execute();

    return this.responseFormat({ summary: 'Account deleted successfully' });
  }
}
