import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShippingAddressDto, UpdateShippingAddressDto } from './dto';

@Injectable()
export class ShippingAddressesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createShippingAddressDto: CreateShippingAddressDto) {
    // If setting as primary, unset other primary addresses
    if (createShippingAddressDto.isPrimary) {
      await this.prisma.shippingAddress.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const shippingAddress = await this.prisma.shippingAddress.create({
      data: {
        ...createShippingAddressDto,
        userId,
      },
    });

    return shippingAddress;
  }

  async findAll(userId: number) {
    const shippingAddresses = await this.prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return shippingAddresses;
  }

  async findOne(id: number, userId: number, role: string) {
    const shippingAddress = await this.prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Users can view their own addresses, admins can view any
    if (role !== 'ADMIN' && shippingAddress.userId !== userId) {
      throw new ForbiddenException('You can only view your own shipping addresses');
    }

    return shippingAddress;
  }

  async update(id: number, userId: number, role: string, updateShippingAddressDto: UpdateShippingAddressDto) {
    const shippingAddress = await this.prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Users can update their own addresses, admins can update any
    if (role !== 'ADMIN' && shippingAddress.userId !== userId) {
      throw new ForbiddenException('You can only update your own shipping addresses');
    }

    // If setting as primary, unset other primary addresses
    if (updateShippingAddressDto.isPrimary) {
      await this.prisma.shippingAddress.updateMany({
        where: { 
          userId: shippingAddress.userId,
          id: { not: id },
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    const updatedShippingAddress = await this.prisma.shippingAddress.update({
      where: { id },
      data: updateShippingAddressDto,
    });

    return updatedShippingAddress;
  }

  async remove(id: number, userId: number, role: string) {
    const shippingAddress = await this.prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Users can delete their own addresses, admins can delete any
    if (role !== 'ADMIN' && shippingAddress.userId !== userId) {
      throw new ForbiddenException('You can only delete your own shipping addresses');
    }

    // Check if this is the only address
    const addressCount = await this.prisma.shippingAddress.count({
      where: { userId: shippingAddress.userId },
    });

    if (addressCount <= 1) {
      throw new BadRequestException('Cannot delete the only shipping address');
    }

    // If deleting primary address, set another address as primary
    if (shippingAddress.isPrimary) {
      const anotherAddress = await this.prisma.shippingAddress.findFirst({
        where: {
          userId: shippingAddress.userId,
          id: { not: id },
        },
      });

      if (anotherAddress) {
        await this.prisma.shippingAddress.update({
          where: { id: anotherAddress.id },
          data: { isPrimary: true },
        });
      }
    }

    await this.prisma.shippingAddress.delete({
      where: { id },
    });

    return { message: 'Shipping address deleted successfully' };
  }

  async setPrimary(id: number, userId: number, role: string) {
    const shippingAddress = await this.prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Users can set their own addresses as primary, admins can set any
    if (role !== 'ADMIN' && shippingAddress.userId !== userId) {
      throw new ForbiddenException('You can only set your own shipping addresses as primary');
    }

    // Unset other primary addresses
    await this.prisma.shippingAddress.updateMany({
      where: { 
        userId: shippingAddress.userId,
        id: { not: id },
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    // Set this address as primary
    const updatedShippingAddress = await this.prisma.shippingAddress.update({
      where: { id },
      data: { isPrimary: true },
    });

    return updatedShippingAddress;
  }

  async getPrimaryAddress(userId: number) {
    const primaryAddress = await this.prisma.shippingAddress.findFirst({
      where: {
        userId,
        isPrimary: true,
      },
    });

    if (!primaryAddress) {
      // Return the most recent address if no primary is set
      const recentAddress = await this.prisma.shippingAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return recentAddress;
    }

    return primaryAddress;
  }
}