const crypto = require('crypto');
const { initDb, run, get } = require('./db');

const names = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Dhruv', 'Kabir', 'Ritvik', 'Aaryan', 'Omer', 'Rudra', 'Aryan', 'Zayn', 'Diya', 'Ananya', 'Aadhya', 'Kiara', 'Saanvi', 'Prisha', 'Avni', 'Kavya', 'Pari', 'Isha', 'Aarohi', 'Pihu', 'Neha', 'Riya', 'Kriti', 'Myra', 'Tara', 'Roshni', 'Sia', 'Meera', 'Rohan', 'Vikas', 'Rahul', 'Amit', 'Neha', 'Pooja', 'Priya', 'Sneha', 'Ravi', 'Rakesh'];
const locations = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];
const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];

const products = [
  { name: 'Classic White T-Shirt', price: 999 },
  { name: 'Dark Wash Denim Jeans', price: 2499 },
  { name: 'Leather Jacket', price: 5999 },
  { name: 'Running Sneakers', price: 3499 },
  { name: 'Summer Floral Dress', price: 1899 },
  { name: 'Cashmere Sweater', price: 4500 },
  { name: 'Polarized Sunglasses', price: 1200 },
  { name: 'Signature Espresso Blend', price: 450 },
  { name: 'Cold Brew Concentrate', price: 600 },
  { name: 'Vitamin C Serum', price: 850 },
  { name: 'Hydrating Moisturizer', price: 1100 }
];

const reviews = [
  { rating: 5, text: 'Absolutely loved it! The quality is amazing.' },
  { rating: 5, text: 'Perfect fit and great material. Will buy again.' },
  { rating: 4, text: 'Good product, but delivery was a bit late.' },
  { rating: 4, text: 'Nice, but slightly more expensive than I expected.' },
  { rating: 3, text: 'It is okay. Nothing special.' },
  { rating: 2, text: 'Customer explicitly noted a 2-star satisfaction rating due to damaged packaging.' },
  { rating: 1, text: 'Terrible experience. The size was completely wrong.' },
  { rating: 5, text: 'Fantastic! Best purchase I have made this year.' },
  { rating: null, text: null }, // Some without reviews
  { rating: null, text: null }
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

async function seedData() {
  await initDb();
  
  // Check if we already have data
  const count = await get('SELECT COUNT(*) as c FROM customers');
  if (count.c > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding customers and orders...');
  
  const customerIds = [];
  
  // Generate 80 Customers
  for (let i = 0; i < 80; i++) {
    const id = crypto.randomUUID();
    const name = names[Math.floor(Math.random() * names.length)] + ' ' + names[Math.floor(Math.random() * names.length)];
    const email = name.replace(' ', '.').toLowerCase() + Math.floor(Math.random() * 100) + '@' + domains[Math.floor(Math.random() * domains.length)];
    const phone = '+91' + Math.floor(6000000000 + Math.random() * 3999999999);
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    // Created anywhere from 1 year ago to 1 month ago
    const createdAt = randomDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    await run('INSERT INTO customers (id, name, email, phone, location, created_at) VALUES (?, ?, ?, ?, ?, ?)', [id, name, email, phone, location, createdAt]);
    customerIds.push({ id, createdAt });
  }

  // Generate 350 Orders
  for (let i = 0; i < 350; i++) {
    const id = crypto.randomUUID();
    const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
    
    // Select 1-3 random products
    const orderItems = [];
    let totalAmount = 0;
    const numItems = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      orderItems.push(product.name);
      totalAmount += product.price;
    }
    
    const review = reviews[Math.floor(Math.random() * reviews.length)];
    const purchaseDate = randomDate(new Date(customer.createdAt), new Date());
    
    await run('INSERT INTO orders (id, customer_id, amount, items, review_text, rating, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [id, customer.id, totalAmount, JSON.stringify(orderItems), review.text, review.rating, purchaseDate]
    );
  }

  console.log('Seeding complete. Added 80 customers and 350 orders.');
}

if (require.main === module) {
  seedData().catch(console.error);
}

module.exports = { seedData };
