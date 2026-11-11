import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

// Equivalente a ParseUUIDPipe (clase 10) pero para ids de MongoDB: 400 si el formato es basura
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!isValidObjectId(valor)) throw new BadRequestException('El id no es válido');
    return valor;
  }
}
