import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as https from 'https';
import * as http from 'http';
import { User, UserRole } from './users/entities/user.entity';
import { Media, MediaType, MediaStatus, MediaVisibility } from './media/entities/media.entity';
import { StorageService } from './storage/storage.service';

// Sample images from picsum.photos and sample videos from sample-videos.com
const SAMPLE_MEDIA = [
  {
    url: 'https://picsum.photos/id/1015/1200/800',
    filename: 'mountain_landscape.jpg',
    type: MediaType.IMAGE,
    title: 'Mountain Landscape',
    description: 'Beautiful mountain view at sunset',
    visibility: MediaVisibility.PUBLIC,
    price: 0,
    isFeatured: true,
    viewCount: 1520,
    purchaseCount: 0,
  },
  {
    url: 'https://picsum.photos/id/1025/1200/800',
    filename: 'cute_puppy.jpg',
    type: MediaType.IMAGE,
    title: 'Cute Puppy',
    description: 'Adorable golden retriever puppy',
    visibility: MediaVisibility.PUBLIC,
    price: 0,
    isFeatured: true,
    viewCount: 3200,
    purchaseCount: 0,
  },
  {
    url: 'https://picsum.photos/id/1043/1200/800',
    filename: 'city_night.jpg',
    type: MediaType.IMAGE,
    title: 'City Night Lights',
    description: 'Vibrant city skyline at night',
    visibility: MediaVisibility.PUBLIC,
    price: 2.99,
    isFeatured: false,
    viewCount: 890,
    purchaseCount: 156,
  },
  {
    url: 'https://picsum.photos/id/1047/1200/800',
    filename: 'ocean_waves.jpg',
    type: MediaType.IMAGE,
    title: 'Ocean Waves',
    description: 'Peaceful ocean waves crashing on shore',
    visibility: MediaVisibility.PUBLIC,
    price: 0,
    isFeatured: true,
    viewCount: 2100,
    purchaseCount: 0,
  },
  {
    url: 'https://picsum.photos/id/1059/1200/800',
    filename: 'autumn_forest.jpg',
    type: MediaType.IMAGE,
    title: 'Autumn Forest Path',
    description: 'Golden autumn leaves in a forest trail',
    visibility: MediaVisibility.PUBLIC,
    price: 1.99,
    isFeatured: false,
    viewCount: 670,
    purchaseCount: 89,
  },
  {
    url: 'https://picsum.photos/id/1069/1200/800',
    filename: 'neon_abstract.jpg',
    type: MediaType.IMAGE,
    title: 'Neon Abstract Art',
    description: 'Colorful neon abstract design',
    visibility: MediaVisibility.PUBLIC,
    price: 4.99,
    isFeatured: true,
    viewCount: 4500,
    purchaseCount: 320,
  },
  {
    url: 'https://picsum.photos/id/1035/1200/800',
    filename: 'waterfall.jpg',
    type: MediaType.IMAGE,
    title: 'Tropical Waterfall',
    description: 'Hidden waterfall in tropical jungle',
    visibility: MediaVisibility.PRIVATE,
    price: 0,
    isFeatured: false,
    viewCount: 120,
    purchaseCount: 0,
  },
  {
    url: 'https://picsum.photos/id/1080/1200/800',
    filename: 'starry_night.jpg',
    type: MediaType.IMAGE,
    title: 'Starry Night Sky',
    description: 'Milky way galaxy visible on a clear night',
    visibility: MediaVisibility.PUBLIC,
    price: 3.49,
    isFeatured: true,
    viewCount: 5600,
    purchaseCount: 480,
  },
  {
    url: 'https://picsum.photos/id/180/1200/800',
    filename: 'flower_macro.jpg',
    type: MediaType.IMAGE,
    title: 'Flower Macro',
    description: 'Close-up of a beautiful red flower',
    visibility: MediaVisibility.PUBLIC,
    price: 0,
    isFeatured: false,
    viewCount: 340,
    purchaseCount: 0,
  },
  {
    url: 'https://picsum.photos/id/237/1200/800',
    filename: 'black_labrador.jpg',
    type: MediaType.IMAGE,
    title: 'Black Labrador',
    description: 'Portrait of a black labrador retriever',
    visibility: MediaVisibility.PUBLIC,
    price: 0.99,
    isFeatured: false,
    viewCount: 1800,
    purchaseCount: 210,
  },
];

function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const follow = (url: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirects + 1);
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const storage = app.get(StorageService);

  const userRepo = dataSource.getRepository(User);
  const mediaRepo = dataSource.getRepository(Media);

  console.log('🌱 Starting seed...');

  // Check if data already exists
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('⚠️  Database already has users. Skipping seed.');
    await app.close();
    return;
  }

  // ─── Create Users ───────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 12);

  const admin = userRepo.create({
    email: 'admin@oro.com',
    password: hashedPassword,
    name: 'Oro Admin',
    role: UserRole.ADMIN,
    isActive: true,
  });

  const user1 = userRepo.create({
    email: 'alice@example.com',
    password: hashedPassword,
    name: 'Alice Nguyen',
    role: UserRole.USER,
    isActive: true,
  });

  const user2 = userRepo.create({
    email: 'bob@example.com',
    password: hashedPassword,
    name: 'Bob Tran',
    role: UserRole.USER,
    isActive: true,
  });

  const user3 = userRepo.create({
    email: 'carol@example.com',
    password: hashedPassword,
    name: 'Carol Le',
    role: UserRole.USER,
    isActive: true,
  });

  await userRepo.save([admin, user1, user2, user3]);
  console.log('✅ Created 4 users (1 admin + 3 users)');

  // ─── Upload sample media ───────────────────────────
  const users = [admin, user1, user2, user3];

  for (let i = 0; i < SAMPLE_MEDIA.length; i++) {
    const sample = SAMPLE_MEDIA[i];
    const owner = users[i % users.length]; // distribute among users

    try {
      console.log(`📥 Downloading ${sample.filename}...`);
      const buffer = await downloadFile(sample.url);

      const key = `media/${owner.id}/${Date.now()}_${sample.filename}`;
      const mimeType = sample.type === MediaType.IMAGE ? 'image/jpeg' : 'video/mp4';

      await storage.upload(key, buffer, mimeType, buffer.length);

      const media = mediaRepo.create({
        userId: owner.id,
        type: sample.type,
        originalUrl: key,
        originalFilename: sample.filename,
        mimeType,
        fileSize: buffer.length,
        status: MediaStatus.READY,
        title: sample.title,
        description: sample.description,
        visibility: sample.visibility,
        price: sample.price,
        isFeatured: sample.isFeatured,
        viewCount: sample.viewCount,
        purchaseCount: sample.purchaseCount,
      });

      await mediaRepo.save(media);
      console.log(`✅ Uploaded: ${sample.title} (by ${owner.name})`);
    } catch (err) {
      console.error(`❌ Failed to upload ${sample.filename}:`, err);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log('─────────────────────────────────────');
  console.log('Sample accounts (password: password123):');
  console.log('  Admin: admin@oro.com');
  console.log('  User1: alice@example.com');
  console.log('  User2: bob@example.com');
  console.log('  User3: carol@example.com');
  console.log('─────────────────────────────────────');

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
