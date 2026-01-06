import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardsQueryDto } from './dto/rewards-query.dto';

@Injectable()
export class RewardService {
  constructor(private prisma: PrismaService) {}

  async create(createRewardDto: CreateRewardDto) {
    return this.prisma.reward.create({
      data: {
        name: createRewardDto.name,
        description: createRewardDto.description || null,
        costPoints: createRewardDto.costPoints,
        stock: createRewardDto.stock || 0,
        active:
          createRewardDto.active !== undefined ? createRewardDto.active : true,
      },
    });
  }

  async findAll(query: RewardsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RewardWhereInput = {};
    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [rewards, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          costPoints: 'asc',
        },
      }),
      this.prisma.reward.count({ where }),
    ]);

    return {
      data: rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
    });

    if (!reward) {
      throw new NotFoundException('Phần thưởng không tồn tại');
    }

    return reward;
  }

  async update(id: string, updateRewardDto: UpdateRewardDto) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
    });

    if (!reward) {
      throw new NotFoundException('Phần thưởng không tồn tại');
    }

    return this.prisma.reward.update({
      where: { id },
      data: {
        ...(updateRewardDto.name && { name: updateRewardDto.name }),
        ...(updateRewardDto.description !== undefined && {
          description: updateRewardDto.description,
        }),
        ...(updateRewardDto.costPoints !== undefined && {
          costPoints: updateRewardDto.costPoints,
        }),
        ...(updateRewardDto.stock !== undefined && {
          stock: updateRewardDto.stock,
        }),
        ...(updateRewardDto.active !== undefined && {
          active: updateRewardDto.active,
        }),
      },
    });
  }

  async remove(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            redeems: {
              where: {
                status: {
                  in: ['pending', 'approved'],
                },
              },
            },
          },
        },
      },
    });

    if (!reward) {
      throw new NotFoundException('Phần thưởng không tồn tại');
    }

    if (reward._count.redeems > 0) {
      throw new BadRequestException(
        'Không thể xóa phần thưởng đang có đơn đổi đang xử lý',
      );
    }

    return this.prisma.reward.delete({
      where: { id },
    });
  }
}
