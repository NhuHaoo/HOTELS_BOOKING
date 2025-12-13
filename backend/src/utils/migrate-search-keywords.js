/**
 * Migration Script: Populate searchKeywords for existing hotels
 * 
 * Chạy script này 1 lần để thêm searchKeywords cho các hotel hiện có
 * 
 * Cách chạy:
 * node backend/src/utils/migrate-search-keywords.js
 * hoặc
 * npm run migrate:keywords
 */

const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const config = require('../config/env');

// Load environment variables
require('dotenv').config();

// Mapping địa danh → keywords
const locationKeywordsMap = {
  'Quảng Ninh': ['vinh ha long', 'ha long', 'quang ninh', 'vinh halong'],
  'Cẩm Phả': ['cam pha', 'cam pha quang ninh'],
  'Hội An': ['hoi an', 'pho co hoi an', 'ancient town'],
  'Đà Nẵng': ['da nang', 'my khe', 'non nuoc'],
  'Hà Nội': ['ha noi', 'ho guom', 'pho co', 'hoan kiem'],
  'Nha Trang': ['nha trang', 'vinh nha trang'],
  'Phú Quốc': ['phu quoc', 'dao phu quoc'],
  'Đà Lạt': ['da lat', 'dalat'],
  'Sapa': ['sapa', 'sa pa'],
  'Huế': ['hue', 'cung dinh hue'],
  'Vũng Tàu': ['vung tau', 'bai sau'],
  'Mũi Né': ['mui ne', 'phan thiet'],
};

// Helper: Tạo keywords từ address và city
function generateKeywords(address, city) {
  const keywords = new Set();
  const addressLower = (address || '').toLowerCase();
  const cityLower = (city || '').toLowerCase();

  // 1. Thêm keywords từ mapping dựa trên city
  if (city && locationKeywordsMap[city]) {
    locationKeywordsMap[city].forEach(kw => keywords.add(kw));
  }

  // 2. Thêm keywords từ mapping dựa trên address
  Object.keys(locationKeywordsMap).forEach(location => {
    if (addressLower.includes(location.toLowerCase())) {
      locationKeywordsMap[location].forEach(kw => keywords.add(kw));
    }
  });

  // 3. Thêm city name không dấu
  if (city) {
    const cityNoTones = city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
    keywords.add(cityNoTones);
  }

  return Array.from(keywords);
}

// Main migration function
async function migrateSearchKeywords() {
  try {
    // Connect to MongoDB
    console.log('🔌 Đang kết nối MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả hotels
    console.log('📋 Đang lấy danh sách hotels...');
    const hotels = await Hotel.find({});
    console.log(`📊 Tìm thấy ${hotels.length} hotels`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Cập nhật từng hotel
    for (const hotel of hotels) {
      // Bỏ qua nếu đã có searchKeywords và không rỗng
      if (hotel.searchKeywords && hotel.searchKeywords.length > 0) {
        skippedCount++;
        continue;
      }

      // Tạo keywords từ address và city
      const keywords = generateKeywords(hotel.address, hotel.city);

      if (keywords.length > 0) {
        // Cập nhật hotel
        hotel.searchKeywords = keywords;
        await hotel.save();
        updatedCount++;
        
        console.log(`✅ Đã cập nhật: ${hotel.name} (${hotel.city})`);
        console.log(`   Keywords: ${keywords.join(', ')}`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n📈 KẾT QUẢ MIGRATION:');
    console.log(`   ✅ Đã cập nhật: ${updatedCount} hotels`);
    console.log(`   ⏭️  Đã bỏ qua: ${skippedCount} hotels`);
    console.log(`   📊 Tổng cộng: ${hotels.length} hotels`);

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('\n✅ Migration hoàn tất!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi migration:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Chạy migration
if (require.main === module) {
  migrateSearchKeywords();
}

module.exports = { migrateSearchKeywords, generateKeywords };

