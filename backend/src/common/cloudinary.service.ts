import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Sube la imagen (en memoria) y devuelve la URL pública
  subirImagen(archivo: Express.Multer.File, carpeta: string): Promise<string> {
    if (!archivo.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `red-social/${carpeta}` }, (error, resultado) => {
          if (error || !resultado) {
            new Logger(CloudinaryService.name).error(error?.message ?? 'Sin resultado');
            return reject(new InternalServerErrorException('No se pudo subir la imagen'));
          }
          resolve(resultado.secure_url);
        })
        .end(archivo.buffer);
    });
  }
}
