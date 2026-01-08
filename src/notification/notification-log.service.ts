import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationLogDto } from './dto/create-notification-log.dto';
import { UpdateNotificationLogDto } from './dto/update-notification-log.dto';
import { NotificationLogsQueryDto } from './dto/notification-logs-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationLogService {
    constructor(private prisma: PrismaService) {}

    async create(createDto: CreateNotificationLogDto) {
        return this.prisma.notificationLog.create({
            data: {
                userId: createDto.userId,
                borrowId: createDto.borrowId,
                title: createDto.title,
                body: createDto.body,
                status: createDto.status || 'pending',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                borrow: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findAll(query: NotificationLogsQueryDto, userId?: string) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.NotificationLogWhereInput = {};

        // Nếu có userId trong query hoặc từ request, lọc theo userId
        if (userId) {
            where.userId = userId;
        } else if (query.userId) {
            where.userId = query.userId;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.borrowId) {
            where.borrowId = query.borrowId;
        }

        if (query.isRead !== undefined) {
            where.isRead = query.isRead;
        }

        const [logs, total] = await Promise.all([
            this.prisma.notificationLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        },
                    },
                    borrow: {
                        include: {
                            book: {
                                select: {
                                    id: true,
                                    title: true,
                                    author: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.notificationLog.count({ where }),
        ]);

        return {
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, userId?: string) {
        const log = await this.prisma.notificationLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                borrow: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true,
                            },
                        },
                    },
                },
            },
        });

        if (!log) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        // Kiểm tra quyền: user chỉ có thể xem thông báo của chính mình
        if (userId && log.userId !== userId) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        return log;
    }

    async update(id: string, updateDto: UpdateNotificationLogDto, userId?: string) {
        const log = await this.prisma.notificationLog.findUnique({
            where: { id },
        });

        if (!log) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        // Kiểm tra quyền: user chỉ có thể cập nhật thông báo của chính mình
        if (userId && log.userId !== userId) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        const updateData: Prisma.NotificationLogUpdateInput = {};

        if (updateDto.title !== undefined) {
            updateData.title = updateDto.title;
        }

        if (updateDto.body !== undefined) {
            updateData.body = updateDto.body;
        }

        if (updateDto.status !== undefined) {
            updateData.status = updateDto.status;
            // Nếu status là 'sent', tự động set sentAt
            if (updateDto.status === 'sent') {
                updateData.sentAt = new Date();
            }
        }

        if (updateDto.errorMessage !== undefined) {
            updateData.errorMessage = updateDto.errorMessage;
        }

        if (updateDto.isRead !== undefined) {
            updateData.isRead = updateDto.isRead;
            // Nếu đánh dấu đã đọc, tự động set readAt
            if (updateDto.isRead === true) {
                updateData.readAt = new Date();
            } else if (updateDto.isRead === false) {
                updateData.readAt = null;
            }
        }

        return this.prisma.notificationLog.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                borrow: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async remove(id: string, userId?: string) {
        const log = await this.prisma.notificationLog.findUnique({
            where: { id },
        });

        if (!log) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        // Kiểm tra quyền: user chỉ có thể xóa thông báo của chính mình
        if (userId && log.userId !== userId) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        return this.prisma.notificationLog.delete({
            where: { id },
        });
    }

    /**
     * Đánh dấu một thông báo đã đọc
     */
    async markAsRead(id: string, userId?: string) {
        const log = await this.prisma.notificationLog.findUnique({
            where: { id },
        });

        if (!log) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        // Kiểm tra quyền: user chỉ có thể đánh dấu thông báo của chính mình
        if (userId && log.userId !== userId) {
            throw new NotFoundException('Thông báo không tồn tại');
        }

        // Nếu đã đọc rồi thì không cần update
        if (log.isRead) {
            return this.prisma.notificationLog.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                        },
                    },
                    borrow: {
                        include: {
                            book: {
                                select: {
                                    id: true,
                                    title: true,
                                    author: true,
                                },
                            },
                        },
                    },
                },
            });
        }

        return this.prisma.notificationLog.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                    },
                },
                borrow: {
                    include: {
                        book: {
                            select: {
                                id: true,
                                title: true,
                                author: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Đánh dấu tất cả thông báo của user đã đọc
     */
    async markAllAsRead(userId: string) {
        const result = await this.prisma.notificationLog.updateMany({
            where: {
                userId,
                isRead: false, // Chỉ update những thông báo chưa đọc
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return {
            message: 'Tất cả thông báo đã được đánh dấu đã đọc',
            count: result.count,
        };
    }
}
