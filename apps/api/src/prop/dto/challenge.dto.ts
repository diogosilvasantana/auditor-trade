import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateChallengeDto {
    @IsString()
    name: string;

    @IsNumber()
    profitTarget: number;

    @IsNumber()
    dailyMaxLoss: number;

    @IsNumber()
    totalMaxDrawdown: number;

    @IsArray()
    allowedSymbols: string[];

    @IsOptional()
    maxContractsBySymbol?: Record<string, number>;

    @IsOptional()
    @IsString()
    rulesText?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    @IsString()
    accountId?: string;
}
