import { Client } from 'minio';

export class UploadsService {
  private client: Client;
  private bucket: string;

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    this.bucket = process.env.MINIO_BUCKET || 'quien-sabe-files';
  }

  async uploadImage(file: File, folder: string = 'uploads'): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': file.type,
    });

    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `http://${endpoint}:${port}/${this.bucket}/${key}`;
  }

  async getFile(key: string) {
    try {
      return await this.client.getObject(this.bucket, key);
    } catch {
      return null;
    }
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}

export const getUploadsService = () => {
  return new UploadsService();
};
