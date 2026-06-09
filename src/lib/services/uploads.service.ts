import type { R2Bucket } from '@cloudflare/workers-types';

export class UploadsService {
  private bucket: R2Bucket;

  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  async uploadImage(file: File, folder: string = 'uploads'): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.name}`;
    
    await this.bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return key; 
  }

  async getFile(key: string) {
    return await this.bucket.get(key);
  }
}

export const getUploadsService = (context: any) => {
  const bucket = context.locals?.runtime?.env?.BUCKET || context.locals?.BUCKET;
  if (!bucket) {
    throw new Error('R2 Bucket binding (BUCKET) not found');
  }
  return new UploadsService(bucket);
};
