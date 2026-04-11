import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async getShippingMethods() {
    const methods = await this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });

    return methods.map(method => ({
      id: method.id,
      name: method.name,
      description: method.description,
      cost: Number(method.cost),
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
    }));
  }

  async getShippingMethod(id: number) {
    const method = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });

    if (!method) {
      throw new NotFoundException(`Shipping method with ID ${id} not found`);
    }

    return {
      id: method.id,
      name: method.name,
      description: method.description,
      cost: Number(method.cost),
      estimatedDays: method.estimatedDays,
      isActive: method.isActive,
    };
  }
}
