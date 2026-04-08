import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  private readonly uploadUrl = process.env.UPLOAD_URL || 'http://localhost:3001';

  getFileUrl(filename: string): { url: string } {
    const url = `${this.uploadUrl}/uploads/${filename}`;
    return { url };
  }
}
