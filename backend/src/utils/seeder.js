const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Favorite = require('../models/Favorite');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '0901234567',
    passwordHash: 'admin123',
    role: 'admin'
  },
  {
    name: 'Nguyen Van A',
    email: 'user1@example.com',
    phone: '0912345678',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Tran Thi B',
    email: 'user2@example.com',
    phone: '0923456789',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Le Van C',
    email: 'user3@example.com',
    phone: '0934567890',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Pham Thi D',
    email: 'user4@example.com',
    phone: '0945678901',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Hoang Van E',
    email: 'user5@example.com',
    phone: '0956789012',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Vo Thi F',
    email: 'user6@example.com',
    phone: '0967890123',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Do Van G',
    email: 'user7@example.com',
    phone: '0978901234',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Bui Thi H',
    email: 'user8@example.com',
    phone: '0989012345',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Dang Van I',
    email: 'user9@example.com',
    phone: '0990123456',
    passwordHash: 'password123',
    role: 'user'
  },
  {
    name: 'Ngo Thi K',
    email: 'user10@example.com',
    phone: '0991234567',
    passwordHash: 'password123',
    role: 'user'
  }
];

const hotels = [
  {
    name: 'Grand Hotel Da Nang',
    address: '123 Bach Dang Street, Hai Chau District',
    city: 'Đà Nẵng',
    location: {
      type: 'Point',
      coordinates: [108.2226, 16.0678]
    },
    description: 'Luxury beachfront hotel with stunning ocean views',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'
    ],
    rating: 4.5,
    amenities: ['pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'parking'],
    phone: '0236 3888 999',
    email: 'info@grandhotel.com',
    website: 'https://grandhotel.com',
    checkInTime: '14:00',
    checkOutTime: '12:00'
  },
  {
    name: 'Royal Hotel Hanoi',
    address: '456 Tran Hung Dao Street, Hoan Kiem District',
    city: 'Hà Nội',
    location: {
      type: 'Point',
      coordinates: [105.8542, 21.0285]
    },
    description: 'Elegant hotel in the heart of Hanoi Old Quarter',
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d'
    ],
    rating: 4.7,
    amenities: ['restaurant', 'bar', 'wifi', 'parking', 'gym'],
    phone: '024 3825 8888',
    email: 'info@royalhotel.com',
    website: 'https://royalhotel.com',
    checkInTime: '14:00',
    checkOutTime: '12:00'
  },
  {
    name: 'Saigon Paradise Hotel',
    address: '789 Nguyen Hue Street, District 1',
    city: 'Hồ Chí Minh',
    location: {
      type: 'Point',
      coordinates: [106.7008, 10.7769]
    },
    description: 'Modern hotel with rooftop pool and city views',
    images: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39'
    ],
    rating: 4.6,
    amenities: ['pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'parking', 'airport-shuttle'],
    phone: '028 3823 8888',
    email: 'info@saigonparadise.com',
    website: 'https://saigonparadise.com',
    checkInTime: '14:00',
    checkOutTime: '12:00'
  }
];

const getRoomsByHotelId = (hotelId, hotelName) => [
  {
    hotelId,
    name: `${hotelName} - Standard Room`,
    description: 'Cozy standard room with essential amenities',
    price: 800000,
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af'
    ],
    amenities: ['wifi', 'tv', 'air-conditioning', 'minibar'],
    rating: 4.3,
    maxGuests: 2,
    roomType: 'single',
    bedType: 'queen',
    numberOfBeds: 1,
    view: 'city',
    size: 25
  },
  {
    hotelId,
    name: `${hotelName} - Deluxe Room`,
    description: 'Spacious deluxe room with premium furnishings',
    price: 1500000,
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ],
    amenities: ['wifi', 'tv', 'air-conditioning', 'minibar', 'safe', 'bathtub'],
    rating: 4.5,
    maxGuests: 2,
    roomType: 'deluxe',
    bedType: 'king',
    numberOfBeds: 1,
    view: 'ocean',
    size: 35
  },
  {
    hotelId,
    name: `${hotelName} - Suite`,
    description: 'Luxury suite with separate living area',
    price: 3000000,
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
      'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa'
    ],
    amenities: ['wifi', 'tv', 'air-conditioning', 'minibar', 'safe', 'bathtub', 'balcony', 'kitchen'],
    rating: 4.8,
    maxGuests: 4,
    roomType: 'suite',
    bedType: 'king',
    numberOfBeds: 2,
    view: 'ocean',
    size: 60
  },
  {
    hotelId,
    name: `${hotelName} - Family Room`,
    description: 'Perfect for families with multiple beds',
    price: 2000000,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7'
    ],
    amenities: ['wifi', 'tv', 'air-conditioning', 'minibar', 'safe'],
    rating: 4.4,
    maxGuests: 4,
    roomType: 'family',
    bedType: 'double',
    numberOfBeds: 2,
    view: 'garden',
    size: 45
  }
];

// Import data
const importData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Delete existing data
    console.log('🗑️  Deleting existing data...');
    await User.deleteMany();
    await Hotel.deleteMany();
    await Room.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Favorite.deleteMany();

    // Import users
    console.log('👥 Importing users...');
    const createdUsers = await User.create(users);
    console.log(`✅ ${createdUsers.length} users imported`);

    // Import hotels
    console.log('🏨 Importing hotels...');
    const createdHotels = await Hotel.create(hotels);
    console.log(`✅ ${createdHotels.length} hotels imported`);

    // Import rooms for each hotel
    console.log('🛏️  Importing rooms...');
    let allRooms = [];
    for (const hotel of createdHotels) {
      const rooms = getRoomsByHotelId(hotel._id, hotel.name);
      const createdRooms = await Room.create(rooms);
      
      // Update hotel with room IDs
      hotel.rooms = createdRooms.map(room => room._id);
      await hotel.save();
      
      allRooms.push(...createdRooms);
    }
    console.log(`✅ ${allRooms.length} rooms imported`);

    // Create sample bookings
    console.log('📅 Creating sample bookings...');
    const regularUsers = createdUsers.filter(u => u.role === 'user');
    let bookingCount = 0;
    
    const bookingStatuses = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'];
    const bookingWeights = [0.2, 0.1, 0.5, 0.15, 0.05]; // 50% checked-out for reviews
    
    for (let i = 0; i < 50; i++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const randomRoom = allRooms[Math.floor(Math.random() * allRooms.length)];
      const randomHotel = createdHotels.find(h => h._id.equals(randomRoom.hotelId));
      
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 90)); // Random past 90 days
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 nights
      
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = randomRoom.price * nights;
      
      // Select booking status based on weights
      const rand = Math.random();
      let cumulativeWeight = 0;
      let selectedStatus = 'confirmed';
      for (let j = 0; j < bookingStatuses.length; j++) {
        cumulativeWeight += bookingWeights[j];
        if (rand <= cumulativeWeight) {
          selectedStatus = bookingStatuses[j];
          break;
        }
      }
      
      await Booking.create({
        userId: randomUser._id,
        roomId: randomRoom._id,
        hotelId: randomHotel._id,
        checkIn,
        checkOut,
        guests: Math.floor(Math.random() * randomRoom.maxGuests) + 1,
        totalPrice,
        paymentStatus: selectedStatus === 'cancelled' ? 'cancelled' : 'paid',
        paymentMethod: 'vnpay',
        bookingStatus: selectedStatus,
        guestName: randomUser.name,
        guestEmail: randomUser.email,
        guestPhone: randomUser.phone
      });
      
      bookingCount++;
    }
    console.log(`✅ ${bookingCount} bookings created`);

    // Create sample reviews
    console.log('⭐ Creating sample reviews...');
    const completedBookings = await Booking.find({ bookingStatus: 'checked-out' }).populate('roomId');
    let reviewCount = 0;
    
    // Track unique user-room combinations to avoid duplicates
    const reviewedPairs = new Set();
    
    const reviewComments = [
      'Phòng rất sạch sẽ và thoải mái! Nhân viên thân thiện, dịch vụ chu đáo.',
      'Vị trí thuận tiện, gần trung tâm. Giá cả hợp lý, sẽ quay lại lần sau.',
      'Phòng đẹp, view tuyệt vời! Tiện nghi đầy đủ, giá trị đáng đồng tiền.',
      'Trải nghiệm tuyệt vời, rất hài lòng. Highly recommend cho gia đình!',
      'Cơ sở vật chất hiện đại, đầy đủ tiện nghi. Bữa sáng ngon và đa dạng.',
      'Phòng rộng rãi, sạch sẽ. Nhân viên nhiệt tình, hỗ trợ tận tâm.',
      'Vị trí đắc địa, dễ dàng di chuyển. Giá tốt, chất lượng vượt mong đợi.',
      'Khách sạn sang trọng, phục vụ chuyên nghiệp. Sẽ giới thiệu cho bạn bè.',
      'Không gian yên tĩnh, thích hợp nghỉ ngơi. View đẹp, không khí trong lành.',
      'Phòng thoải mái, giường ngủ êm ái. WiFi nhanh, điều hòa mát. Perfect!',
      'Dịch vụ tốt, nhân viên thân thiện. Vị trí gần biển, rất tiện lợi.',
      'Khách sạn đẹp, có hồ bơi tuyệt vời. Ăn uống ngon, giá cả phải chăng.'
    ];
    
    for (const booking of completedBookings) {
      if (!booking.roomId) continue; // Skip if room not found
      
      const pairKey = `${booking.userId}_${booking.roomId._id}`;
      
      // Skip if this user already reviewed this room
      if (reviewedPairs.has(pairKey)) {
        continue;
      }
      
      // 80% chance to create review (not all bookings have reviews)
      if (Math.random() > 0.8) continue;
      
      const rating = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5 stars
      const variance = (Math.random() - 0.5) * 0.5; // -0.25 to +0.25
      
      try {
        const review = await Review.create({
          userId: booking.userId,
          roomId: booking.roomId._id,
          hotelId: booking.hotelId,
          bookingId: booking._id,
          rating: rating,
          cleanliness: Math.min(5, Math.max(1, Math.round((rating + variance) * 10) / 10)),
          comfort: Math.min(5, Math.max(1, Math.round((rating + variance) * 10) / 10)),
          location: Math.min(5, Math.max(1, Math.round((rating + variance * 0.5) * 10) / 10)),
          service: Math.min(5, Math.max(1, Math.round((rating + variance) * 10) / 10)),
          valueForMoney: Math.min(5, Math.max(1, Math.round((rating + variance * 0.5) * 10) / 10)),
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          isVerified: true,
          helpfulCount: Math.floor(Math.random() * 20)
        });
        
        reviewedPairs.add(pairKey);
        reviewCount++;
      } catch (error) {
        // Skip duplicate reviews
        if (error.code !== 11000) {
          console.log(`Error creating review: ${error.message}`);
        }
      }
    }
    console.log(`✅ ${reviewCount} reviews created`);

    // Create sample favorites
    console.log('❤️  Creating sample favorites...');
    let favoriteCount = 0;
    
    for (const user of regularUsers) {
      const randomRooms = allRooms.sort(() => 0.5 - Math.random()).slice(0, 3);
      for (const room of randomRooms) {
        await Favorite.create({
          userId: user._id,
          roomId: room._id
        });
        favoriteCount++;
      }
    }
    console.log(`✅ ${favoriteCount} favorites created`);

    console.log('\n✅ Data imported successfully!');
    console.log('\n📝 Sample credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user1@example.com / password123');
    console.log('User: user2@example.com / password123');
    console.log('\n📊 Statistics:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Hotels: ${createdHotels.length}`);
    console.log(`- Rooms: ${allRooms.length}`);
    console.log(`- Bookings: ${bookingCount}`);
    console.log(`- Reviews: ${reviewCount}`);
    console.log(`- Favorites: ${favoriteCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('🗑️  Deleting all data...');
    await User.deleteMany();
    await Hotel.deleteMany();
    await Room.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Favorite.deleteMany();

    console.log('✅ Data deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting data:', error);
    process.exit(1);
  }
};

// Sync room ratings from reviews
const syncRatings = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('🔄 Syncing all room ratings from reviews...\n');

    // Get all rooms
    const rooms = await Room.find({});
    console.log(`📊 Found ${rooms.length} rooms\n`);

    let updatedCount = 0;
    let noChangeCount = 0;
    let noReviewsCount = 0;

    for (const room of rooms) {
      // Get approved reviews for this room
      const reviews = await Review.find({ 
        roomId: room._id, 
        status: 'approved' 
      });

      const oldRating = room.rating;
      const oldTotalReviews = room.totalReviews;

      if (reviews.length === 0) {
        // No reviews - set default
        if (room.rating !== 0 || room.totalReviews !== 0) {
          await Room.findByIdAndUpdate(room._id, {
            rating: 0,
            totalReviews: 0
          });
          console.log(`⚪ ${room.name}`);
          console.log(`   No reviews: ${oldRating}⭐ (${oldTotalReviews} reviews) → 0⭐ (0 reviews)\n`);
          noReviewsCount++;
        } else {
          noReviewsCount++;
        }
        continue;
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = parseFloat((totalRating / reviews.length).toFixed(1));

      // Update if different
      if (avgRating !== oldRating || reviews.length !== oldTotalReviews) {
        await Room.findByIdAndUpdate(room._id, {
          rating: avgRating,
          totalReviews: reviews.length
        });

        console.log(`✅ ${room.name}`);
        console.log(`   Updated: ${oldRating}⭐ (${oldTotalReviews} reviews) → ${avgRating}⭐ (${reviews.length} reviews)\n`);
        updatedCount++;
      } else {
        noChangeCount++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SYNC COMPLETED!\n');
    console.log(`✅ Updated: ${updatedCount} rooms`);
    console.log(`✓  No change: ${noChangeCount} rooms`);
    console.log(`⚪ No reviews: ${noReviewsCount} rooms`);
    console.log(`📊 Total: ${rooms.length} rooms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing ratings:', error);
    process.exit(1);
  }
};

// Run from command line
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else if (process.argv[2] === '-s') {
  syncRatings();
} else {
  console.log('Usage:');
  console.log('  Import data:  node src/utils/seeder.js -i');
  console.log('  Delete data:  node src/utils/seeder.js -d');
  console.log('  Sync ratings: node src/utils/seeder.js -s');
}

