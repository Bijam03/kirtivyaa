const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const Product  = require('../models/Product');
const User     = require('../models/User');
const Settings = require('../models/Settings');

const products = [
  {
    name: 'Belgian Chocolate Truffle Cake',
    slug: 'belgian-chocolate-truffle-cake',
    description: 'Rich Belgian dark chocolate sponge layered with silky truffle ganache and fresh cream.',
    shortDescription: 'Signature dark chocolate cake with truffle ganache',
    price: 899, category: 'Cakes', badge: 'bestseller',
    isFeatured: true, isBestSeller: true, customizable: true,
    weight: '500g', servings: '4–6 people',
    images: [{ url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', publicId: '' }],
    ingredients: ['Belgian dark chocolate', 'Amul butter', 'Fresh cream', 'Sugar'],
    allergens: ['Gluten', 'Dairy'],
    flavourOptions: ['Dark Chocolate', 'Milk Chocolate', 'White Chocolate'],
    sizeOptions: [{ label:'Half Kg', price:899 },{ label:'1 Kg', price:1599 }],
    rating: 4.9, numReviews: 128, sortOrder: 1,
  },
  {
    name: 'Fudgy Walnut Brownie Box',
    slug: 'fudgy-walnut-brownie-box',
    description: 'Six ultra-fudgy brownies packed with toasted walnuts.',
    shortDescription: '6 brownies with toasted walnuts',
    price: 349, category: 'Brownies',
    weight: '300g', servings: '6 pieces',
    images: [{ url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', publicId: '' }],
    ingredients: ['Dark chocolate', 'Walnuts', 'Butter', 'Sugar', 'Flour'],
    allergens: ['Gluten', 'Dairy', 'Tree nuts'],
    rating: 4.8, numReviews: 96, sortOrder: 2,
  },
  {
    name: 'Choco Hazelnut Cupcakes',
    slug: 'choco-hazelnut-cupcakes',
    description: 'Moist chocolate cupcakes with Nutella buttercream.',
    shortDescription: 'Choco cupcakes with Nutella buttercream',
    price: 499, category: 'Cupcakes',
    weight: '6 pieces',
    images: [{ url: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800', publicId: '' }],
    ingredients: ['Nutella', 'Dark chocolate', 'Butter', 'Sugar', 'Hazelnuts'],
    allergens: ['Gluten', 'Dairy', 'Tree nuts'],
    rating: 4.7, numReviews: 43, sortOrder: 3,
  },
  {
    name: 'Triple Chocolate Layer Cake',
    slug: 'triple-chocolate-layer-cake',
    description: 'Three layers of pure indulgence.',
    shortDescription: 'Dark, milk & white chocolate layers',
    price: 1099, category: 'Cakes',
    isFeatured: true,
    weight: '750g',
    images: [{ url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', publicId: '' }],
    ingredients: ['Belgian chocolate', 'Cream', 'Butter', 'Sugar'],
    allergens: ['Gluten', 'Dairy'],
    rating: 5.0, numReviews: 84,
  }
];

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');
};

const seed = async () => {
  await connectDB();

  await Product.deleteMany();
  await Product.insertMany(products);
  console.log(`✅ Seeded ${products.length} products`);

  await Settings.findByIdAndUpdate('site_settings', {
    brandName: 'Kirtivyaa',
    city: 'Pune',
    whatsappNumber: '917350554539',
    storeOpen: true,
  }, { upsert: true });

  const adminExists = await User.findOne({ email: 'kirti@kirtivyaa.in' });
  if (!adminExists) {
    await User.create({
      name: 'Kirti Agarwal',
      email: 'kirti@kirtivyaa.in',
      password: 'Kirti@12345',
      role: 'admin',
    });
    console.log('✅ Admin created');
  }

  mongoose.disconnect();
  console.log('🌱 Seeding complete!');
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});