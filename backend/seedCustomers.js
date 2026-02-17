const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sewithdebby';

const sampleCustomers = [
  {
    firstName: 'Marie',
    lastName: 'Uwase',
    email: 'marie.uwase@email.com',
    phone: '+250788111222',
    password: 'password123',
    totalOrders: 3,
    totalSpent: 125000,
    addresses: [{
      firstName: 'Marie',
      lastName: 'Uwase',
      phone: '+250788111222',
      address: 'KG 123 St',
      city: 'Kigali',
      district: 'Gasabo',
      country: 'Rwanda',
      isDefault: true
    }]
  },
  {
    firstName: 'Jean',
    lastName: 'Mugabo',
    email: 'jean.mugabo@email.com',
    phone: '+250788333444',
    password: 'password123',
    totalOrders: 5,
    totalSpent: 250000,
    addresses: [{
      firstName: 'Jean',
      lastName: 'Mugabo',
      phone: '+250788333444',
      address: 'KN 456 Ave',
      city: 'Kigali',
      district: 'Kicukiro',
      country: 'Rwanda',
      isDefault: true
    }]
  },
  {
    firstName: 'Grace',
    lastName: 'Mukamana',
    email: 'grace.mukamana@email.com',
    phone: '+250788555666',
    password: 'password123',
    totalOrders: 2,
    totalSpent: 85000,
    addresses: [{
      firstName: 'Grace',
      lastName: 'Mukamana',
      phone: '+250788555666',
      address: 'KG 789 Rd',
      city: 'Kigali',
      district: 'Nyarugenge',
      country: 'Rwanda',
      isDefault: true
    }]
  },
  {
    firstName: 'Patrick',
    lastName: 'Niyonzima',
    email: 'patrick.niyonzima@email.com',
    phone: '+250788777888',
    password: 'password123',
    totalOrders: 1,
    totalSpent: 45000,
    addresses: [{
      firstName: 'Patrick',
      lastName: 'Niyonzima',
      phone: '+250788777888',
      address: 'KK 321 St',
      city: 'Kigali',
      district: 'Gasabo',
      country: 'Rwanda',
      isDefault: true
    }]
  },
  {
    firstName: 'Diane',
    lastName: 'Umutoni',
    email: 'diane.umutoni@email.com',
    phone: '+250788999000',
    password: 'password123',
    totalOrders: 4,
    totalSpent: 180000,
    addresses: [{
      firstName: 'Diane',
      lastName: 'Umutoni',
      phone: '+250788999000',
      address: 'KN 654 Ave',
      city: 'Kigali',
      district: 'Kicukiro',
      country: 'Rwanda',
      isDefault: true
    }]
  }
];

async function seedCustomers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing customers...');
    await User.deleteMany({});
    console.log('✅ Cleared existing customers');

    console.log('👥 Creating sample customers...');
    
    for (const customerData of sampleCustomers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(customerData.password, salt);
      
      const customer = new User({
        ...customerData,
        password: hashedPassword,
        isActive: true,
        emailVerified: true,
        phoneVerified: true
      });
      
      await customer.save();
      console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);
    }

    console.log('\n🎉 Successfully created', sampleCustomers.length, 'sample customers!');
    console.log('\n📊 Customer Summary:');
    console.log('─'.repeat(50));
    
    const customers = await User.find().select('-password');
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.firstName} ${customer.lastName}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Orders: ${customer.totalOrders} | Spent: ${customer.totalSpent.toLocaleString()} RWF`);
      console.log(`   Address: ${customer.addresses[0]?.city}, ${customer.addresses[0]?.district}`);
      console.log('');
    });
    
    console.log('─'.repeat(50));
    console.log('\n✅ You can now view these customers in the admin dashboard!');
    console.log('🌐 Go to: http://localhost:5173/admin → Customers tab');
    
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  }
}

seedCustomers();
