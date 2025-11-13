const Favorite = require('../models/Favorite');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Add room to favorites
// @route   POST /api/favorites
// @access  Private
exports.addFavorite = async (req, res) => {
  try {
    const { roomId } = req.body;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      roomId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Room is already in favorites'
      });
    }

    // Create favorite
    const favorite = await Favorite.create({
      userId: req.user.id,
      roomId
    });

    // Add to user's favorites array
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { favorites: roomId } }
    );

    res.status(201).json({
      success: true,
      message: 'Room added to favorites',
      data: favorite
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate({
        path: 'roomId',
        populate: {
          path: 'hotelId',
          select: 'name address city rating'
        }
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove room from favorites
// @route   DELETE /api/favorites/:id
// @access  Private
exports.removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Make sure user owns this favorite
    if (favorite.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this favorite'
      });
    }

    // Remove from user's favorites array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: favorite.roomId } }
    );

    await favorite.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Room removed from favorites',
      data: {}
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove favorite by room ID
// @route   DELETE /api/favorites/room/:roomId
// @access  Private
exports.removeFavoriteByRoom = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user.id,
      roomId: req.params.roomId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    // Remove from user's favorites array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { favorites: favorite.roomId } }
    );

    await favorite.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Room removed from favorites',
      data: {}
    });
  } catch (error) {
    console.error('Remove favorite by room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check if room is favorited
// @route   GET /api/favorites/check/:roomId
// @access  Private
exports.checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user.id,
      roomId: req.params.roomId
    });

    res.status(200).json({
      success: true,
      isFavorited: !!favorite
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

