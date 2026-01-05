import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RewardService } from './reward.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardsQueryDto } from './dto/rewards-query.dto';
import { RewardResponseDto } from './dto/reward-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('rewards')
@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo phần thưởng mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo phần thưởng thành công',
    type: RewardResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createRewardDto: CreateRewardDto) {
    return this.rewardService.create(createRewardDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách phần thưởng' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/RewardResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(@Query() query: RewardsQueryDto) {
    return this.rewardService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin phần thưởng theo ID' })
  @ApiParam({ name: 'id', description: 'ID của phần thưởng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: RewardResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Phần thưởng không tồn tại' })
  async findOne(@Param('id') id: string) {
    return this.rewardService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật phần thưởng' })
  @ApiParam({ name: 'id', description: 'ID của phần thưởng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: RewardResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Phần thưởng không tồn tại' })
  async update(@Param('id') id: string, @Body() updateRewardDto: UpdateRewardDto) {
    return this.rewardService.update(id, updateRewardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa phần thưởng' })
  @ApiParam({ name: 'id', description: 'ID của phần thưởng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    type: RewardResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Không thể xóa phần thưởng đang có đơn đổi' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Phần thưởng không tồn tại' })
  async remove(@Param('id') id: string) {
    return this.rewardService.remove(id);
  }
}






