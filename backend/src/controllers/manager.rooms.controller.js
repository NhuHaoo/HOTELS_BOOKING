const Room = require('../models/Room');

const getManagerHotelId = (req, res) => {
  const hotelId = req.user?.hotelId;
  if (!hotelId) {
    res.status(400).json({
      success: false,
      message: 'Manager chưa được gán hotelId'
    });
    return null;
  }
  return hotelId;
};

exports.getMyRooms = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const rooms = await Room.find({ hotelId }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (err) {
    console.error('Manager get rooms error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createMyRoom = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const roomData = { ...req.body, hotelId };

    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: 'Tạo phòng thành công',
      data: room
    });
  } catch (err) {
    console.error('Manager create room error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.updateMyRoom = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, hotelId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng hoặc phòng không thuộc khách sạn của bạn'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật phòng thành công',
      data: room
    });
  } catch (err) {
    console.error('Manager update room error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.deleteMyRoom = async (req, res) => {
  try {
    const hotelId = getManagerHotelId(req, res);
    if (!hotelId) return;

    // soft delete để giữ lịch sử booking
    const room = await Room.findOne({ _id: req.params.id, hotelId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng hoặc phòng không thuộc khách sạn của bạn'
      });
    }

    room.isActive = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Xóa (vô hiệu hóa) phòng thành công'
    });
  } catch (err) {
    console.error('Manager delete room error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};
