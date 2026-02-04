import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Check if category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId, isActive: true },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Generate slug from name
    const slug = this.generateSlug(createProductDto.name);

    // Check if slug already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with similar name already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        slug,
        price: new Prisma.Decimal(createProductDto.price),
        images: createProductDto.images || [],
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async findAll(filter: ProductFilterDto) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      transmission,
      fuelType,
      color,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { color: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    if (minYear !== undefined || maxYear !== undefined) {
      where.year = {};
      if (minYear !== undefined) {
        where.year.gte = minYear;
      }
      if (maxYear !== undefined) {
        where.year.lte = maxYear;
      }
    }

    if (transmission) {
      where.transmission = transmission;
    }

    if (fuelType) {
      where.fuelType = fuelType;
    }

    if (color) {
      where.color = { contains: color };
    }

    const skip = (page - 1) * limit;
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Check if category exists
    if (updateProductDto.categoryId !== existingProduct.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId, isActive: true },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Generate new slug if name changed
    let slug = existingProduct.slug;
    if (updateProductDto.name !== existingProduct.name) {
      slug = this.generateSlug(updateProductDto.name);
      
      // Check if new slug already exists
      const existingWithSlug = await this.prisma.product.findUnique({
        where: { slug },
      });

      if (existingWithSlug && existingWithSlug.id !== id) {
        throw new BadRequestException('Product with similar name already exists');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        slug,
        price: new Prisma.Decimal(updateProductDto.price),
        images: updateProductDto.images || existingProduct.images,
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async remove(id: number) {
    // Soft delete - set isActive to false
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product deleted successfully' };
  }

  async updateStock(id: number, quantity: number, operation: 'add' | 'subtract') {
    const product = await this.prisma.product.findUnique({
      where: { id, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let newStock = product.stock;
    if (operation === 'add') {
      newStock += quantity;
    } else {
      newStock -= quantity;
      if (newStock < 0) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    return { message: 'Stock updated successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
}