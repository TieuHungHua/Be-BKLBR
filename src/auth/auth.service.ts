import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, RegisterRole } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Kiểm tra password và confirmPassword khớp nhau
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Mật khẩu và xác nhận mật khẩu không khớp');
    }

    // Kiểm tra nếu là student thì phải có studentId
    if (registerDto.role === RegisterRole.student && !registerDto.studentId) {
      throw new BadRequestException(
        'Mã sinh viên là bắt buộc cho tài khoản sinh viên',
      );
    }

    // Kiểm tra username đã tồn tại chưa
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: registerDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }

    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Kiểm tra phone đã tồn tại chưa
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: registerDto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        username: registerDto.username,
        email: registerDto.email,
        phone: registerDto.phone,
        password: hashedPassword,
        role: registerDto.role as UserRole, // Convert RegisterRole to UserRole
        studentId: registerDto.studentId || null,
        displayName: registerDto.username, // Mặc định displayName = username
      },
    });

    // Tạo JWT tokens
    const payload = { sub: user.id, username: user.username, role: user.role };
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        email: user.email,
        studentId: user.studentId,
        classMajor: user.classMajor,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      // Tìm user theo username
      const user = await this.prisma.user.findUnique({
        where: { username: loginDto.username },
      });

      if (!user) {
        throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
      }

      // Kiểm tra password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
      }

      // Tạo JWT tokens
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };
      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn: '7d', // Access token: 7 ngày
      });
      const refresh_token = await this.jwtService.signAsync(payload, {
        expiresIn: '30d', // Refresh token: 30 ngày
      });

      return {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          email: user.email,
          studentId: user.studentId,
          classMajor: user.classMajor,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
        },
      };
    } catch (error: unknown) {
      // Xử lý lỗi kết nối database
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P1001'
      ) {
        const errorMessage =
          'message' in error && typeof error.message === 'string'
            ? error.message
            : 'Unknown error';
        console.error('❌ Database connection error:', errorMessage);
        throw new BadRequestException(
          'Không thể kết nối đến database. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
        );
      }
      // Re-throw các lỗi khác (như UnauthorizedException)
      throw error;
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        avatar: true,
        classMajor: true,
      },
    });

    return user;
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        username: string;
        role: UserRole;
      }>(refreshToken);

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // Kiểm tra user còn tồn tại không
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      // Tạo tokens mới
      const newPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };
      const access_token = await this.jwtService.signAsync(newPayload, {
        expiresIn: '7d',
      });
      const new_refresh_token = await this.jwtService.signAsync(newPayload, {
        expiresIn: '30d',
      });

      return {
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
