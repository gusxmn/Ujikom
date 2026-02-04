import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    // Generate slug from name
    const slug = this.generateSlug(createCategoryDto.name);

    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with similar name already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });

    return category;
  }

  async findAll(activeOnly: boolean = true) {
    const where: Prisma.CategoryWhereInput = {};
    
    if (activeOnly) {
      where.isActive = true;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories;
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          take: 10,
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          take: 10,
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      slug = this.generateSlug(updateCategoryDto.name);
      
      // Check if new slug already exists
      const existingWithSlug = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (existingWithSlug && existingWithSlug.id !== id) {
        throw new ConflictException('Category with similar name already exists');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        slug,
      },
    });

    return category;
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new ConflictException('Cannot delete category with existing products');
    }

    // Soft delete
    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Category deleted successfully' };
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