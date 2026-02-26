import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
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

    @IsOptional()
    @IsNumber()
    @Min(0)
    feePerContract?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    profitSplit?: number;
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

    @IsOptional()
    @IsNumber()
    @Min(0)
    feePerContract?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    profitSplit?: number;
}
