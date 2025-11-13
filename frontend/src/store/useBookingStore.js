import { create } from 'zustand';

const useBookingStore = create((set) => ({
  // Booking data
  selectedRoom: null,
  checkIn: null,
  checkOut: null,
  guests: 2,
  guestInfo: {
    name: '',
    email: '',
    phone: '',
  },
  specialRequests: '',
  
  // Set selected room
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  
  // Set dates
  setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
  
  // Set guests
  setGuests: (guests) => set({ guests }),
  
  // Set guest info
  setGuestInfo: (info) => set({ guestInfo: info }),
  
  // Set special requests
  setSpecialRequests: (requests) => set({ specialRequests: requests }),
  
  // Clear booking data
  clearBooking: () => set({
    selectedRoom: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    guestInfo: {
      name: '',
      email: '',
      phone: '',
    },
    specialRequests: '',
  }),
}));

export default useBookingStore;

