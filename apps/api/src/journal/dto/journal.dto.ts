import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';

export enum JournalEmotion {
    CALMO = 'CALMO',
    ANSIOSO = 'ANSIOSO',
    IRRITADO = 'IRRITADO',
    EUFORICO = 'EUFORICO',
    OUTRO = 'OUTRO',
}

export enum FollowedPlan {
    SIM = 'SIM',
    NAO = 'NAO',
    PARCIAL = 'PARCIAL',
}

export class CreateJournalDto {
    @IsString()
    date: string; // YYYY-MM-DD

    @IsEnum(JournalEmotion)
    emotion: JournalEmotion;

    @IsEnum(FollowedPlan)
    followedPlan: FollowedPlan;

    @IsOptional()
    @IsArray()
    triggers?: string[];

    @IsOptional()
    @IsString()
    notes?: string;
}
