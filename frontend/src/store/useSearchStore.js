import { create } from 'zustand';

const useSearchStore = create((set) => ({
  // Search filters
  searchParams: {
    city: '',
    checkIn: null,
    checkOut: null,
    guests: 2,
    minPrice: null,
    maxPrice: null,
    roomType: '',
    amenities: [],
    rating: null,
    sort: '-rating',
  },
  
  // Set search params
  setSearchParams: (params) => set((state) => ({
    searchParams: { ...state.searchParams, ...params },
  })),
  
  // Reset search
  resetSearch: () => set({
    searchParams: {
      city: '',
      checkIn: null,
      checkOut: null,
      guests: 2,
      minPrice: null,
      maxPrice: null,
      roomType: '',
      amenities: [],
      rating: null,
      sort: '-rating',
    },
  }),
}));

export default useSearchStore;

