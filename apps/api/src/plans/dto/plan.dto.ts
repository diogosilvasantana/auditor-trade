import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreatePlanDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(0)
    dailyLossLimit: number;

    @IsNumber()
    @Min(1)
    maxTradesPerDay: number;

    @IsOptional()
    allowedTimeWindows?: { start: string; end: string }[];

    @IsOptional()
    maxContractsBySymbol?: Record<string, number>;

    @IsOptional()
    @IsNumber()
    pauseAfterConsecutiveLosses?: number;

    @IsOptional()
    @IsNumber()
    pauseMinutes?: number;
}
