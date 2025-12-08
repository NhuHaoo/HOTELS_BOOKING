# Changelog - Quản Lý Khách Sạn

File này ghi lại tất cả các thay đổi quan trọng trong dự án.

---

## [2025-12-07] - Fix lỗi hiển thị tổng tiền và trạng thái thanh toán

### 🐛 Bug Fixes

#### 1. **Fix lỗi hiển thị tổng tiền âm và trạng thái sai trong danh sách booking**

**Vấn đề:**
- Trang danh sách booking hiển thị tổng tiền = -624.000đ (sai)
- Trang danh sách booking hiển thị "Đã thanh toán" khi chưa thanh toán đủ (sai)
- Trang chi tiết booking hiển thị đúng nhưng danh sách không đồng bộ

**Nguyên nhân:**
- `getPaymentStatus` đang fallback sang `calcBookingMoney` khi `totalAmount` hoặc `paidAmount` là 0
- `calcBookingMoney` tính lại từ các field khác, không dùng trực tiếp `totalAmount`/`paidAmount` từ backend
- Backend chưa đảm bảo `paidAmount` không bao giờ > `totalAmount`

**Giải pháp:**

**a) Backend (`backend/src/controllers/booking.controller.js`, `backend/src/controllers/payment.controller.js`):**
- ✅ Đảm bảo `paidAmount` không bao giờ > `totalAmount`:
  ```javascript
  if (booking.paidAmount > totalAmount) {
    booking.paidAmount = totalAmount;
  }
  ```
- ✅ Khi reschedule: Cập nhật `totalAmount = total`, giữ nguyên `paidAmount`
- ✅ Khi thanh toán: Cập nhật `paidAmount` đúng cách

**b) Frontend (`frontend/src/utils/bookingCalculations.js`):**
- ✅ Sửa `getPaymentStatus` để luôn ưu tiên `totalAmount`/`paidAmount` từ backend:
  - Chỉ fallback khi thực sự `null` hoặc `undefined` (không phải `0`)
  - Đảm bảo `paid` không bao giờ > `total`
- ✅ Logic kiểm tra:
  ```javascript
  const hasTotalAmount = booking.totalAmount !== null && booking.totalAmount !== undefined;
  const hasPaidAmount = booking.paidAmount !== null && booking.paidAmount !== undefined;
  ```

**c) Frontend (`frontend/src/pages/BookingDetail.jsx`):**
- ✅ Dùng trực tiếp `booking.totalAmount` và `booking.paidAmount` từ backend
- ✅ Không tính lại `paidAmount` từ `paymentStatus` hoặc `reschedulePayment`

**Kết quả:**
- ✅ Tổng tiền luôn dương và đúng (`totalAmount`)
- ✅ Trạng thái thanh toán đồng bộ giữa danh sách và chi tiết
- ✅ Khi đổi lịch chưa thanh toán: Hiển thị "Cần thanh toán thêm X đồng"
- ✅ Khi đã thanh toán đủ: Hiển thị "Đã thanh toán"

---

## [2025-12-07] - Đồng bộ trạng thái thanh toán giữa danh sách và chi tiết booking

### 🔧 Backend Changes

#### 1. **Thêm fields mới vào Booking Model** (`backend/src/models/Booking.js`)

- ✅ Thêm `totalAmount`: Tổng tiền cuối cùng của booking (bao gồm phí đổi lịch, phụ thu, trừ giảm giá)
  - Default: `finalTotal` hoặc `totalPrice`
- ✅ Thêm `paidAmount`: Tổng số tiền đã thanh toán thành công
  - Default: 0
  - Cập nhật khi thanh toán thành công

#### 2. **Cập nhật Reschedule Booking** (`backend/src/controllers/booking.controller.js`)

- ✅ Khi đổi lịch: Cập nhật `totalAmount = total` (giá mới + phí đổi lịch - giảm giá)
- ✅ **KHÔNG** cập nhật `paidAmount` ngay lập tức - giữ nguyên số tiền đã thanh toán trước đó

#### 3. **Cập nhật Payment Controller** (`backend/src/controllers/payment.controller.js`)

- ✅ **Thanh toán thường:**
  - Cập nhật `paidAmount = finalTotal || totalPrice` (số tiền đã thanh toán ban đầu)
- ✅ **Thanh toán reschedule:**
  - Cộng thêm `reschedulePayment.amount` vào `paidAmount`
  - Nếu `paidAmount >= totalAmount` → cập nhật `paymentStatus = 'paid'`

#### 4. **Cập nhật Create Booking** (`backend/src/controllers/booking.controller.js`)

- ✅ Khởi tạo `totalAmount = finalTotal` và `paidAmount = 0` khi tạo booking mới

---

### 🎨 Frontend Changes

#### 1. **Tạo Helper Function** (`frontend/src/utils/bookingCalculations.js`)

- ✅ Thêm hàm `getPaymentStatus(booking)`:
  ```javascript
  {
    total: booking.totalAmount hoặc tính từ calcBookingMoney,
    paid: booking.paidAmount hoặc tính từ calcBookingMoney,
    outstanding: Math.max(total - paid, 0),
    status: 'paid' | 'partial' | 'unpaid'
  }
  ```
- ✅ Logic:
  - `outstanding === 0` → `status = 'paid'`
  - `paid === 0` → `status = 'unpaid'`
  - Ngược lại → `status = 'partial'`

#### 2. **Cập nhật Profile Page** (`frontend/src/pages/Profile.jsx`)

- ✅ Dùng `getPaymentStatus(booking)` thay vì `calcBookingMoney`
- ✅ Hiển thị trạng thái thanh toán:
  - **'paid'**: "Đã thanh toán" (màu xanh)
  - **'unpaid'**: "Chưa thanh toán" (màu đỏ)
  - **'partial'**: "Cần thanh toán thêm X đồng" (màu cam)
- ✅ Hiển thị "Tổng tiền" với màu vàng (`text-yellow-600`)

#### 3. **Cập nhật BookingDetail Page** (`frontend/src/pages/BookingDetail.jsx`)

- ✅ Dùng `getPaymentStatus(booking)` để tính trạng thái
- ✅ Hiển thị trạng thái thanh toán:
  - **'paid'**: Chấm xanh + "Đã thanh toán"
  - **'unpaid'**: Chấm đỏ + "Chưa thanh toán"
  - **'partial'**: Chấm cam + "Chưa thanh toán đủ / Cần thanh toán thêm X đồng"

---

### 🐛 Bug Fixes

1. ✅ **Fix lỗi hiển thị "Đã thanh toán" khi chưa thanh toán đủ sau khi đổi lịch**

   - Trước: Card danh sách luôn hiển thị "Đã thanh toán" dựa trên `paymentStatus`
   - Mới: Dùng `getPaymentStatus` để so sánh `totalAmount` và `paidAmount`
   - Kết quả: Hiển thị đúng "Cần thanh toán thêm X đồng" khi `status = 'partial'`

2. ✅ **Đồng bộ trạng thái thanh toán giữa các màn hình**
   - Danh sách booking và chi tiết booking hiển thị cùng một trạng thái
   - Dùng chung logic `getPaymentStatus`

---

### 📋 Migration Notes

**Để áp dụng các thay đổi:**

1. **Backend:**

   - Không cần migration vì đã có default values
   - Các booking cũ sẽ tự động có:
     - `totalAmount = finalTotal || totalPrice`
     - `paidAmount = 0` (nếu chưa thanh toán) hoặc cần cập nhật thủ công

2. **Cập nhật dữ liệu cũ (nếu cần):**
   ```javascript
   // Script để cập nhật totalAmount và paidAmount cho booking cũ
   // Chạy một lần để đồng bộ dữ liệu
   ```

---

### 📚 Related Files

**Backend:**

- `backend/src/models/Booking.js`
- `backend/src/controllers/booking.controller.js`
- `backend/src/controllers/payment.controller.js`

**Frontend:**

- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/BookingDetail.jsx`
- `frontend/src/utils/bookingCalculations.js`

---

## [2025-12-07] - Cập nhật hệ thống thanh toán và quản lý booking

### 🔧 Backend Changes

#### 1. **Cập nhật Booking Model** (`backend/src/models/Booking.js`)

- ✅ Thêm field `reschedulePayment` để lưu thông tin thanh toán cho đổi lịch:
  - `amount`: Số tiền cần thanh toán
  - `status`: Trạng thái (pending, paid, cancelled)
  - `transactionId`: Mã giao dịch VNPay
  - `paymentDate`, `createdAt`, `paidAt`: Các ngày tháng liên quan
- ✅ Thêm field `rescheduledAt` và `rescheduleInfo` để lưu lịch sử đổi lịch

#### 2. **Cập nhật Reschedule Booking Logic** (`backend/src/controllers/booking.controller.js`)

- ✅ **Tính phí đổi lịch theo Quy tắc A:**
  - `changeFee = roomBaseOld × (changeFeePercent / 100)`
  - Tính trên giá gốc trước giảm giá, không phải giá sau giảm
- ✅ **Công thức tính toán mới:**
  ```javascript
  roomBaseOld = booking.originalTotal (giá gốc trước giảm)
  discount = booking.discountAmount
  roomTotalNew = pricePerNight × newNights
  changeFee = roomBaseOld × (changeFeePercent / 100)
  total = roomTotalNew + changeFee - discount
  alreadyPaid = roomBaseOld - discount
  extraToPay = total - alreadyPaid
  ```
- ✅ Lưu `reschedulePayment` với status `pending` khi có `extraToPay > 0`
- ✅ Cập nhật `rescheduleInfo` với đầy đủ thông tin tính toán

#### 3. **Tạo API Reschedule Payment** (`backend/src/controllers/payment.controller.js`)

- ✅ Thêm hàm `createReschedulePayment`: Tạo VNPay payment URL cho reschedule
- ✅ Cập nhật `vnpayReturn`: Xử lý callback từ VNPay cho reschedule payment
  - Phân biệt payment thường và reschedule payment qua bookingCode suffix `-RESCHEDULE`
  - Cập nhật `reschedulePayment.status = 'paid'` khi thanh toán thành công

#### 4. **Cập nhật Chính sách Hủy phòng** (`backend/src/controllers/booking.controller.js`)

- ✅ Thay đổi logic tính phí hủy:
  - **Trước:** Hủy trong vòng 3 ngày → Phạt 100% giá 1 đêm
  - **Mới:** Hủy trong vòng 3 ngày → Mất phí 50% tổng tiền, hoàn lại 50%
- ✅ Công thức mới:
  ```javascript
  cancellationFee = totalPaid × 0.5  // Mất phí 50%
  refundAmount = totalPaid × 0.5    // Hoàn lại 50%
  ```

#### 5. **Thêm Route Reschedule Payment** (`backend/src/routes/payment.routes.js`)

- ✅ Thêm route: `POST /api/payments/vnpay/reschedule/:bookingId`
- ✅ Cập nhật `checkPaymentStatus` để trả về `reschedulePayment`

---

### 🎨 Frontend Changes

#### 1. **Tạo Utils Dùng Chung** (`frontend/src/utils/bookingCalculations.js`)

- ✅ Tạo hàm `calcBookingMoney(booking)` để tính toán tiền booking:
  - Tính `roomTotal`, `changeFee`, `surcharge`, `discount`
  - Tính `total = roomTotal + changeFee + surcharge - discount`
  - Tính `isPaid = paid >= total`
- ✅ Dùng chung cho cả card danh sách booking và card chi tiết thanh toán

#### 2. **Cập nhật BookingDetail Page** (`frontend/src/pages/BookingDetail.jsx`)

**a) Tự động chuyển sang thanh toán sau khi đổi lịch:**

- ✅ Sau khi reschedule thành công, nếu có `additionalPayment > 0`:
  - Tự động gọi `createReschedulePayment`
  - Redirect sang VNPay
  - Ẩn cảnh báo màu vàng khi đang tự động thanh toán

**b) Cập nhật UI "Chi tiết thanh toán":**

- ✅ Hiển thị đầy đủ breakdown:
  - Giá phòng/đêm
  - Số đêm
  - Tiền phòng
  - Phí đổi lịch (nếu có)
  - Phụ thu (nếu có)
  - Giảm giá (hiển thị số âm, màu xanh)
  - Tổng cộng (màu xanh dương đậm)
  - Số tiền cần thanh toán thêm (nếu đã đổi lịch)
- ✅ Trạng thái thanh toán: Chấm xanh/vàng + text

**c) Cập nhật Modal Reschedule:**

- ✅ Hiển thị breakdown chi tiết trước khi xác nhận:
  - Tiền phòng phát sinh (nếu thêm đêm)
  - Phí đổi lịch (% giá 1 đêm)
  - Tổng số tiền cần thanh toán

**d) Logic tính toán:**

- ✅ Nếu đã đổi lịch: Dùng dữ liệu từ `rescheduleInfo`
- ✅ Nếu chưa đổi lịch: Dùng dữ liệu gốc
- ✅ Đảm bảo tổng tiền hiển thị đúng theo công thức mới

#### 3. **Cập nhật Profile Page** (`frontend/src/pages/Profile.jsx`)

- ✅ Dùng `calcBookingMoney` để tính tổng tiền
- ✅ Hiển thị "Tổng tiền" và trạng thái thanh toán đồng bộ với BookingDetail
- ✅ Thêm trạng thái thanh toán (chấm + text) dưới mỗi booking card

#### 4. **Cập nhật Chính sách Hủy phòng** (Nhiều files)

- ✅ `BookingDetail.jsx`: Hiển thị "Mất phí 50% và hoàn lại 50%"
- ✅ `Booking.jsx`: Cập nhật quy định hủy phòng khi đặt phòng
- ✅ `ManagerHotel.jsx`: Cập nhật mô tả quy định cho manager
- ✅ `Hotels.jsx` (admin): Cập nhật mô tả quy định cho admin

#### 5. **Fix Default freeCancellationDays**

- ✅ `Hotels.jsx` (admin): Đổi default từ 1 → 3 ngày
- ✅ `ManagerHotel.jsx`: Đổi default từ 1 → 3 ngày
- ✅ `BookingDetail.jsx`: Thêm logic đảm bảo minimum 3 ngày cho booking cũ

#### 6. **Cập nhật Payment API** (`frontend/src/api/payment.api.js`)

- ✅ Thêm `createReschedulePayment(bookingId)`: Tạo payment cho reschedule

---

### 📝 Database Schema Changes

#### Booking Model

```javascript
// Thêm mới
reschedulePayment: {
  amount: Number,
  status: String (enum: ['pending', 'paid', 'cancelled']),
  transactionId: String,
  paymentDate: Date,
  createdAt: Date,
  paidAt: Date
}

rescheduledAt: Date
rescheduleInfo: {
  oldCheckIn: Date,
  oldCheckOut: Date,
  newCheckIn: Date,
  newCheckOut: Date,
  isFreeReschedule: Boolean,
  freeRescheduleDays: Number,
  rescheduleFee: Number,
  changeFee: Number,        // Mới
  priceDifference: Number,
  additionalPayment: Number,
  extraToPay: Number,       // Mới
  oldTotalPrice: Number,
  newTotalPrice: Number,
  roomBaseOld: Number,     // Mới
  roomTotalNew: Number,    // Mới
  discount: Number,         // Mới
  discountPercent: Number,  // Mới
  total: Number,            // Mới
  alreadyPaid: Number       // Mới
}
```

---

### 🔄 API Changes

#### New Endpoints

- `POST /api/payments/vnpay/reschedule/:bookingId` - Tạo payment cho reschedule

#### Updated Endpoints

- `PUT /api/bookings/:id/reschedule` - Trả về thêm các field: `changeFee`, `extraToPay`, `roomBaseOld`, `roomTotalNew`, `discount`, `total`, `alreadyPaid`
- `GET /api/payments/status/:bookingId` - Trả về thêm `reschedulePayment`

---

### 🐛 Bug Fixes

1. ✅ **Fix lỗi hiển thị "Hủy miễn phí trước 1 ngày"** khi booking đã hết thời gian

   - Thêm logic kiểm tra `daysUntilCheckIn >= freeCancelDays`
   - Hiển thị cảnh báo khi đã hết thời gian miễn phí

2. ✅ **Fix lỗi booking hiển thị "đã thanh toán" khi chưa thanh toán reschedule payment**

   - Tách riêng `reschedulePayment` status
   - Chỉ cập nhật `reschedulePayment.status` khi thanh toán reschedule

3. ✅ **Fix lỗi tổng tiền không đồng bộ** giữa danh sách booking và chi tiết
   - Dùng chung hàm `calcBookingMoney`
   - Đảm bảo tính toán nhất quán

---

### 📋 Migration Notes

**Để áp dụng các thay đổi:**

1. **Backend:**

   - Không cần migration vì đã dùng `Mixed` type và default values
   - Các booking cũ sẽ tự động có `reschedulePayment = null`

2. **Frontend:**
   - Cần clear cache và rebuild
   - Đảm bảo các booking cũ vẫn hiển thị đúng nhờ fallback logic

---

### ⚠️ Breaking Changes

Không có breaking changes. Tất cả thay đổi đều backward compatible.

---

### 📚 Related Files

**Backend:**

- `backend/src/models/Booking.js`
- `backend/src/controllers/booking.controller.js`
- `backend/src/controllers/payment.controller.js`
- `backend/src/routes/payment.routes.js`

**Frontend:**

- `frontend/src/pages/BookingDetail.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Booking.jsx`
- `frontend/src/pages/admin/Hotels.jsx`
- `frontend/src/pages/manager/ManagerHotel.jsx`
- `frontend/src/api/payment.api.js`
- `frontend/src/utils/bookingCalculations.js`

---

## [Previous Updates]

_(Các cập nhật trước đó sẽ được thêm vào đây)_

---

**Lưu ý:** File này sẽ được cập nhật mỗi khi có thay đổi quan trọng trong hệ thống.
