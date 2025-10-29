import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import * as AdmZip from 'adm-zip';

@Injectable()
export class LocalUploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const filename = `products_${Date.now()}_${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);
    
    fs.writeFileSync(filepath, file.buffer);
    
    // Return URL that will be served by express static
    return `/uploads/${filename}`;
  }

  async uploadBannerImage(file: Express.Multer.File): Promise<string> {
    console.log('uploadBannerImage called with file:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      uploadDir: this.uploadDir
    });

    if (!file) {
      throw new Error('No file provided');
    }

    const filename = `banner_${Date.now()}_${file.originalname}`;
    const filepath = path.join(this.uploadDir, filename);
    
    try {
      console.log('Writing file to:', filepath);
      fs.writeFileSync(filepath, file.buffer);
      console.log('File written successfully');
      
      // Return full URL including the backend host
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const imageUrl = `${baseUrl}/uploads/${filename}`;
      console.log('Returning image URL:', imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading banner image:', error);
      throw new Error('Failed to save banner image: ' + error.message);
    }
  }

  // Keep existing methods for compatibility
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
      total: data.length,
    };

    console.log(`Starting product import for ${data.length} rows`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row['sku']) {
          throw new Error('SKU is required');
        }
        if (!row['name']) {
          throw new Error('Name is required');
        }
        if (!row['moq'] || isNaN(parseInt(row['moq']))) {
          throw new Error('Valid MOQ (minimum order quantity) is required');
        }
        if (!row['price'] || isNaN(parseFloat(row['price']))) {
          throw new Error('Valid price is required');
        }

        const product = await this.prisma.product.create({
          data: {
            sku: row['sku'].toString(),
            name: row['name'].toString(),
            description: row['description']?.toString() || null,
            category: row['category']?.toString() || null,
            collection: row['collection']?.toString() || null,
            tags: row['tags'] ? row['tags'].toString().split(',').map((t: any) => t.trim()).filter(Boolean) : [],
            moq: parseInt(row['moq']),
            price: parseFloat(row['price']),
            pcPrice: row['pc_price'] ? parseFloat(row['pc_price']) : null,
            csPrice: row['cs_price'] ? parseFloat(row['cs_price']) : null,
            pcQuantity: row['pc_quantity'] ? parseInt(row['pc_quantity']) : null,
            csQuantity: row['cs_quantity'] ? parseInt(row['cs_quantity']) : null,
            packSize: row['pack_size']?.toString() || row['packSize']?.toString() || null,
            leadTimeDays: row['lead_time_days'] ? parseInt(row['lead_time_days']) : 
                         row['leadTimeDays'] ? parseInt(row['leadTimeDays']) : null,
            countriesBoughtIn: row['countries_bought_in'] ? 
              row['countries_bought_in'].toString().split(',').map((c: any) => c.trim()).filter(Boolean) : 
              (row['countries'] ? row['countries'].toString().split(',').map((c: any) => c.trim()).filter(Boolean) : []),
            customizationOptions: row['customization_options'] ? 
              row['customization_options'].toString().split(',').map((c: any) => c.trim()).filter(Boolean) :
              (row['customization'] ? row['customization'].toString().split(',').map((c: any) => c.trim()).filter(Boolean) : []),
            filename: row['filename']?.toString() || null,
            aiSuggestion: row['ai_suggestion']?.toString() || row['aiSuggestion']?.toString() || null,
            status: 'ACTIVE',
          },
        });
        
        results.success.push({
          sku: product.sku,
          name: product.name,
          id: product.id,
        });
        console.log(`Successfully imported product: ${product.sku}`);
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error.message);
        results.errors.push({
          row: i + 1,
          sku: row['sku'] || 'N/A',
          error: error.message,
        });
      }
    }

    console.log(`Product import completed: ${results.success.length} success, ${results.errors.length} errors`);
    return results;
  }

  async uploadProductImages(file: Express.Multer.File) {
    const results = {
      success: [],
      errors: [],
      total: 0,
    };

    try {
      // Extract ZIP file
      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();
      
      results.total = zipEntries.length;
      console.log(`Processing ${zipEntries.length} files from ZIP archive`);

      // Create product images directory
      const imagesDir = path.join(this.uploadDir, 'products');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      for (const entry of zipEntries) {
        try {
          // Skip directories
          if (entry.isDirectory) {
            continue;
          }

          const filename = entry.entryName;
          const extension = path.extname(filename).toLowerCase();
          
          // Check if it's a valid image format
          if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
            results.errors.push({
              filename,
              error: 'Invalid image format. Supported: jpg, jpeg, png, gif, webp'
            });
            continue;
          }

          // Extract file to products directory - flatten the path
          const flatFilename = path.basename(filename);
          const outputPath = path.join(imagesDir, flatFilename);
          const fileData = entry.getData();
          
          // Create subdirectories if needed
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          fs.writeFileSync(outputPath, fileData);

          // Update product with image URL if product exists with this filename
          const baseFilename = path.basename(flatFilename, extension);
          const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
          const imageUrl = `${baseUrl}/uploads/products/${flatFilename}`;
          
          try {
            const updatedProduct = await this.prisma.product.updateMany({
              where: { filename: baseFilename },
              data: { 
                images: [imageUrl] // Update the images array
              }
            });

            if (updatedProduct.count > 0) {
              results.success.push({
                filename: flatFilename,
                imageUrl,
                productsUpdated: updatedProduct.count,
                message: `Updated ${updatedProduct.count} product(s) with image`
              });
            } else {
              results.success.push({
                filename: flatFilename,
                imageUrl,
                productsUpdated: 0,
                message: 'Image uploaded but no matching product found'
              });
            }
          } catch (dbError) {
            // Image was uploaded successfully but DB update failed
            results.success.push({
              filename: flatFilename,
              imageUrl,
              productsUpdated: 0,
              message: 'Image uploaded but product update failed: ' + dbError.message
            });
          }

          console.log(`Successfully processed image: ${flatFilename}`);
        } catch (error) {
          console.error(`Error processing ${entry.entryName}:`, error.message);
          results.errors.push({
            filename: entry.entryName,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error processing ZIP file:', error.message);
      results.errors.push({
        filename: file.originalname,
        error: 'Failed to extract ZIP file: ' + error.message
      });
    }

    console.log(`Image upload completed: ${results.success.length} success, ${results.errors.length} errors`);
    return results;
  }
}