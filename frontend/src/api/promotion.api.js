import axios from "axios";

// Tự lấy token để gửi vào header
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const promotionAPI = {
  // APPLY COUPON (public)
  applyCoupon: ({ code, totalAmount }) => {
    return axios.post("/api/promotions/apply", { code, totalAmount });
  },

  // GET ALL (admin)
  getAll: () => {
    return axios.get("/api/promotions", {
      headers: authHeaders(),
    });
  },

  // GET ONE (admin)
  getById: (id) => {
    return axios.get(`/api/promotions/${id}`, {
      headers: authHeaders(),
    });
  },

  // CREATE (admin)
  create: (payload) => {
    return axios.post("/api/promotions", payload, {
      headers: authHeaders(),
    });
  },

  // UPDATE (admin)
  update: (id, payload) => {
    return axios.put(`/api/promotions/${id}`, payload, {
      headers: authHeaders(),
    });
  },

  // DELETE (admin)
  remove: (id) => {
    return axios.delete(`/api/promotions/${id}`, {
      headers: authHeaders(),
    });
  },

  // ACTIVE COUPONS (public)
  getActiveCoupons: () => {
    return axios.get("/api/promotions/active-coupons");
  },

  // HOT PROMOTION (public)
  getHotPromotion: () => {
    return axios.get("/api/promotions/hot");
  },
};
