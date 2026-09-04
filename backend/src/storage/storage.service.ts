import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand,
  HeadBucketCommand, CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Stockage privé compatible S3 : MinIO en local, Cloudflare R2 en production.
 * Le bucket n'est jamais public — tout accès passe par une URL signée temporaire.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket = process.env.MINIO_BUCKET || process.env.R2_BUCKET || 'trackart';

  constructor() {
    const r2Endpoint = process.env.R2_ENDPOINT;
    this.s3 = new S3Client(
      r2Endpoint
        ? {
            endpoint: r2Endpoint,
            region: 'auto',
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY!,
              secretAccessKey: process.env.R2_SECRET_KEY!,
            },
          }
        : {
            endpoint: `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
            region: 'us-east-1',
            credentials: {
              accessKeyId: process.env.MINIO_ACCESS_KEY!,
              secretAccessKey: process.env.MINIO_SECRET_KEY!,
            },
            forcePathStyle: true,
          },
    );
  }

  /** Crée le bucket au démarrage s'il n'existe pas (utile en local avec MinIO). */
  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" créé`);
      } catch (err) {
        this.logger.warn(`Impossible de vérifier/créer le bucket "${this.bucket}" : ${(err as Error).message}`);
      }
    }
  }

  async upload(key: string, body: Buffer, contentType: string) {
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
    return key;
  }

  /** URL signée courte durée (par défaut 10 min) — jamais d'URL directe vers les originaux. */
  async getSignedUrl(key: string, expiresIn = 600) {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, cmd, { expiresIn });
  }

  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
