import { PartialType } from '@nestjs/swagger';
import { CreateShippingAddressDto } from './index';

export class UpdateShippingAddressDto extends PartialType(CreateShippingAddressDto) {}