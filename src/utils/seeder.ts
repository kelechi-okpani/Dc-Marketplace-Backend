import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Category from '../models/Category.model';
import { PromotionPackage } from '../models/Promotion.model';

const categories = [
  { name: 'Vehicles', slug: 'vehicles', order: 1, isHighRisk: true, icon: '🚗' },
  { name: 'Property', slug: 'property', order: 2, isHighRisk: true, icon: '🏠' },
  { name: 'Phones & Tablets', slug: 'phones-tablets', order: 3, isHighRisk: true, icon: '📱' },
  { name: 'Electronics', slug: 'electronics', order: 4, icon: '📺' },
  { name: 'Home, Furniture & Appliances', slug: 'home-furniture-appliances', order: 5, icon: '🛋️' },
  { name: 'Fashion', slug: 'fashion', order: 6, icon: '👗' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', order: 7, icon: '💄' },
  { name: 'Services', slug: 'services', order: 8, icon: '🔧' },
  { name: 'Repair & Construction', slug: 'repair-construction', order: 9, icon: '🏗️' },
  { name: 'Commercial Equipment & Tools', slug: 'commercial-equipment-tools', order: 10, icon: '⚙️' },
  { name: 'Leisure & Activities', slug: 'leisure-activities', order: 11, icon: '⚽' },
  { name: 'Babies & Kids', slug: 'babies-kids', order: 12, icon: '🍼' },
  { name: 'Food, Agriculture & Farming', slug: 'food-agriculture-farming', order: 13, icon: '🌾' },
  { name: 'Animals & Pets', slug: 'animals-pets', order: 14, icon: '🐾' },
  { name: 'Jobs', slug: 'jobs', order: 15, isHighRisk: true, icon: '💼' },
  { name: 'Seeking Work - CVs', slug: 'seeking-work-cvs', order: 16, icon: '📄' },
];

const promotionPackages = [
  { name: 'Quick Boost - 3 Days', type: 'boost', durationDays: 3, price: 500, priority: 1 },
  { name: 'Standard Boost - 7 Days', type: 'boost', durationDays: 7, price: 1000, priority: 2 },
  { name: 'Premium Boost - 30 Days', type: 'boost', durationDays: 30, price: 3000, priority: 3 },
  { name: 'Featured Listing - 7 Days', type: 'featured', durationDays: 7, price: 2000, priority: 5 },
  { name: 'Homepage Featured - 7 Days', type: 'homepage_banner', durationDays: 7, price: 5000, priority: 10 },
];

const seedDB = async (): Promise<void> => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  await Category.deleteMany();
  await PromotionPackage.deleteMany();

  await Category.insertMany(categories);
  console.log(`✅ Seeded ${categories.length} categories`);

  await PromotionPackage.insertMany(promotionPackages);
  console.log(`✅ Seeded ${promotionPackages.length} promotion packages`);

  process.exit(0);
};

seedDB().catch((err) => { console.error(err); process.exit(1); });