import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
    @IsString()
    name: string;

    @IsEnum(AccountType)
    type: AccountType;

    @IsOptional()
    @IsString()
    broker?: string;

    @IsOptional()
    @IsString()
    accountNumber?: string;
}

export class UpdateAccountDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(AccountType)
    type?: AccountType;

    @IsOptional()
    @IsString()
    broker?: string;

    @IsOptional()
    @IsString()
    accountNumber?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
