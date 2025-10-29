import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private s3Client: S3Client;

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const key = `products/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async uploadBannerImage(file: Express.Multer.File): Promise<string> {
    const key = `banners/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000', // 1 year cache for banners
      Metadata: {
        'optimized': 'true',
        'type': 'banner'
      }
    });

    await this.s3Client.send(command);
    
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async importOutlets(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      success: [],
      errors: [],
    };

    for (const row of data) {
      try {
        const hashedPassword = await bcrypt.hash(row['password'] || 'default123', 10);
        
        const user = await this.prisma.user.create({
          data: {
            email: row['email'],
            passwordHash: hashedPassword,
            fullName: row['full_name'],
            phone: row['phone'],
            role: 'RETAILER',
            outlets: {
              create: {
                outletName: row['outlet_name'],
                addressJson: {
                  street: row['street'],
                  city: row['city'],
                  postcode: row['postcode'],
                  country: row['country'],
                },
                vatNo: row['vat_no'],
                buyingGroup: row['buying_group'],
              },
            },
          },
        });
        
        results.success.push(user.email);
      } catch (error) {
        results.errors.push({
          row: row['email'],
          error: error.message,
        });
      }
    }

    return results;
  }

  async importProducts(file: Express.Multer.File) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const results = {
      success: [],
      errors: [],
    };

    for (const row of data) {
      try {
        const product = await this.prisma.product.create({
          data: {
            sku: row['sku'],
            name: row['name'],
            description: row['description'],
            category: row['category'],
            collection: row['collection'],
            tags: row['tags']?.split(',').map(t => t.trim()) || [],
            moq: parseInt(row['moq']),
            price: parseFloat(row['price'] || row['price_min'] || '0'),
            packSize: row['pack_size'],
            leadTimeDays: parseInt(row['lead_time_days']),
            countriesBoughtIn: row['countries']?.split(',').map(c => c.trim()) || [],
            customizationOptions: row['customization']?.split(',').map(c => c.trim()) || [],
            status: 'ACTIVE',
          },
        });
        
        results.success.push(product.sku);
      } catch (error) {
        results.errors.push({
          sku: row['sku'],
          error: error.message,
        });
      }
    }

    return results;
  }
}