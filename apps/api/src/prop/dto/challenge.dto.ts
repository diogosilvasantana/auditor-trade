import {
    IsString,
    IsNumber,
    IsObject,
    IsOptional,
    IsUUID,
    IsDateString,
    IsEnum,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PropChallengeType {
    EVALUATION = 'EVALUATION',
    INCUBATOR = 'INCUBATOR',
    DIRECT = 'DIRECT'
}

export enum PropChallengeStatus {
    ACTIVE = 'ACTIVE',
    APPROVED = 'APPROVED',
    FAILED = 'FAILED'
}

export class CreateChallengeDto {
    @IsString()
    name: string;

    @IsEnum(PropChallengeType)
    @IsOptional()
    type?: PropChallengeType;

    @IsEnum(PropChallengeStatus)
    @IsOptional()
    status?: PropChallengeStatus;

    @IsNumber()
    @Type(() => Number)
    profitTarget: number;

    @IsNumber()
    @Type(() => Number)
    dailyMaxLoss: number;

    @IsNumber()
    @Type(() => Number)
    totalMaxDrawdown: number; // Keeping variable name the same for compatibility, but represents Total Loss Limit

    @IsArray()
    allowedSymbols: string[];

    @IsObject()
    @IsOptional()
    maxContractsBySymbol?: object;

    @IsString()
    @IsOptional()
    rulesText?: string;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsUUID()
    @IsOptional()
    accountId?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    winFee?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    wdoFee?: number;
}
