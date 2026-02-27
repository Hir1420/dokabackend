import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { slug: 'headphones', name: 'Headphones', image: 'https://images.unsplash.com/photo-1695634463848-4db4e47703a4?w=1080' },
  { slug: 'laptops', name: 'Laptop', image: 'https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?w=1080' },
  { slug: 'smartphones', name: 'Smartphone', image: 'https://images.unsplash.com/photo-1646719223599-9864b351e242?w=1080' },
  { slug: 'accessories', name: 'Accessories', image: 'https://images.unsplash.com/photo-1749133581229-ea10d588f414?w=1080' },
  { slug: 'camera', name: 'Camera', image: 'https://images.unsplash.com/photo-1532272278764-53cd1fe53f72?w=1080' },
  { slug: 'gadgets', name: 'Gadgets', image: 'https://images.unsplash.com/photo-1765805914327-1e4b17f658bf?w=1080' },
];

const products = [
  { name: 'AirMax Pro Wireless Headphones', description: 'Premium wireless headphones with active noise cancellation.', price: 349.99, originalPrice: 449.99, categorySlug: 'headphones', brand: 'AudioTech', image: 'https://images.unsplash.com/photo-1695634463848-4db4e47703a4?w=1080', stock: 45, rating: 4.8, reviewCount: 1243, trending: true, featured: true },
  { name: 'AirBuds Pro 2', description: 'Premium wireless earbuds with adaptive transparency.', price: 249.99, categorySlug: 'headphones', brand: 'Apple', image: 'https://images.unsplash.com/photo-1598900863662-da1c3e6dd9d9?w=1080', stock: 67, rating: 4.8, reviewCount: 3421, trending: true, featured: true },
  { name: 'Quantum Gaming Headset RGB', description: '7.1 surround sound gaming headset with RGB.', price: 179.99, originalPrice: 229.99, categorySlug: 'headphones', brand: 'Razer', image: 'https://images.unsplash.com/photo-1641169707717-5704974b69dd?w=1080', stock: 34, rating: 4.7, reviewCount: 892, trending: true, featured: false },
  { name: 'ProBook Elite 15', description: '15-inch business laptop with 16GB RAM, 512GB SSD.', price: 999.99, originalPrice: 1099.99, categorySlug: 'laptops', brand: 'HP', image: 'https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?w=1080', stock: 28, rating: 4.6, reviewCount: 445, trending: true, featured: true },
  { name: 'MacBook Air M3', description: 'Thin and light with M3 chip, 8GB RAM, 256GB.', price: 1199.99, categorySlug: 'laptops', brand: 'Apple', image: 'https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?w=1080', stock: 52, rating: 4.9, reviewCount: 2100, trending: true, featured: true },
  { name: 'Pixel 9 Pro', description: 'Latest Google phone with AI features, 128GB.', price: 899.99, categorySlug: 'smartphones', brand: 'Google', image: 'https://images.unsplash.com/photo-1646719223599-9864b351e242?w=1080', stock: 78, rating: 4.7, reviewCount: 890, trending: true, featured: true },
  { name: 'iPhone 16', description: 'A18 chip, 128GB storage, Pro camera system.', price: 999.99, categorySlug: 'smartphones', brand: 'Apple', image: 'https://images.unsplash.com/photo-1646719223599-9864b351e242?w=1080', stock: 120, rating: 4.8, reviewCount: 3400, trending: true, featured: true },
  { name: 'Wireless Charging Pad', description: 'Fast 15W Qi wireless charger for phones and earbuds.', price: 39.99, categorySlug: 'accessories', brand: 'Anker', image: 'https://images.unsplash.com/photo-1749133581229-ea10d588f414?w=1080', stock: 200, rating: 4.5, reviewCount: 1200, trending: false, featured: false },
  { name: 'Pro DSLR Camera', description: '24MP sensor, 4K video, interchangeable lens.', price: 1299.99, categorySlug: 'camera', brand: 'Canon', image: 'https://images.unsplash.com/photo-1532272278764-53cd1fe53f72?w=1080', stock: 25, rating: 4.8, reviewCount: 567, trending: false, featured: true },
  { name: 'Smart Watch Ultra', description: 'GPS, heart rate, 7-day battery, water resistant.', price: 349.99, categorySlug: 'gadgets', brand: 'Samsung', image: 'https://images.unsplash.com/photo-1765805914327-1e4b17f658bf?w=1080', stock: 88, rating: 4.6, reviewCount: 2340, trending: true, featured: true },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name, image: c.image },
    });
  }

  const categoryIds = await prisma.category.findMany().then((list) => Object.fromEntries(list.map((x) => [x.slug, x.id])));
  const productCount = await prisma.product.count();
  if (productCount > 0) {
    console.log('Products already exist, skipping product seed.');
  } else {
  for (const p of products) {
    const categoryId = categoryIds[p.categorySlug];
    if (!categoryId) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        originalPrice: (p as { originalPrice?: number }).originalPrice ?? null,
        categoryId,
        brand: p.brand,
        images: JSON.stringify([p.image]),
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        trending: p.trending,
        featured: p.featured,
      },
    });
  }
  }

  const adminEmail = 'admin@doka.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { email: adminEmail, name: 'Admin', password: hash, isAdmin: true },
    });
    console.log('Admin user created: admin@doka.com / admin123');
  }

  const heroCount = await prisma.heroSlide.count();
  if (heroCount === 0) {
    await prisma.heroSlide.createMany({
      data: [
        { image: 'https://images.unsplash.com/photo-1695634463848-4db4e47703a4?w=1080', title: 'AirMax Pro', subtitle: 'Wireless Headphones', cta: 'Shop Now', link: '1', sortOrder: 0 },
        { image: 'https://images.unsplash.com/flagged/photo-1576697010739-6373b63f3204?w=1080', title: 'MacBook Air M3', subtitle: 'Supercharged by M3', cta: 'Explore', link: '101', sortOrder: 1 },
        { image: 'https://images.unsplash.com/photo-1646719223599-9864b351e242?w=1080', title: 'Galaxy S24 Ultra', subtitle: 'AI-Powered Innovation', cta: 'Learn More', link: '201', sortOrder: 2 },
      ],
    });
    console.log('Hero slides seeded.');
  }

  console.log('Seed done.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
