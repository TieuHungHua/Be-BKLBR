import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum FilterOperator {
  EQ = 'EQ',
  NE = 'NE',
  IN = 'IN',
  GTE = '>=',
  LTE = '<=',
  GT = '>',
  LT = '<',
  CONTAINS = 'CONTAINS',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class BookingFilterDto {
  @ApiProperty({ example: 'status', description: 'Field name' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    example: 'IN',
    description: 'Operator',
    enum: FilterOperator,
  })
  @IsEnum(FilterOperator, { message: 'op must be a valid operator' })
  op: FilterOperator;

  @ApiProperty({
    example: ['pending', 'approved'],
    description: 'Filter value',
  })
  @IsDefined({ message: 'value is required' })
  value: unknown;
}

export class BookingSortDto {
  @ApiProperty({ example: 'start_at', description: 'Field name' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    example: 'DESC',
    description: 'Sort direction',
    enum: SortDirection,
  })
  @IsEnum(SortDirection, { message: 'dir must be ASC or DESC' })
  dir: SortDirection;
}

export class BookingSearchCriteriaDto {
  @ApiProperty({
    example: 1,
    description: 'Page number (1-based)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Items per page',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize must be an integer' })
  @Min(1, { message: 'pageSize must be at least 1' })
  pageSize?: number = 20;

  @ApiProperty({
    type: [BookingFilterDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingFilterDto)
  filters?: BookingFilterDto[];

  @ApiProperty({
    type: [BookingSortDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingSortDto)
  sorts?: BookingSortDto[];
}
