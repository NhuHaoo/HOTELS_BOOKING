// frontend/src/components/PromoCodeBox.jsx
import { useState } from 'react';
import { promotionAPI } from '../api/promotion.api';
import toast from 'react-hot-toast';

const PromoCodeBox = ({ totalAmount, onChange }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      setLoading(true);

      // ✅ GỌI ĐÚNG CÁCH: truyền object { code, totalAmount }
      const res = await promotionAPI.applyCoupon({
        code: code.trim(),
        totalAmount,
      });

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || 'Mã không hợp lệ');
      }

      toast.success(data.message || 'Áp dụng thành công!');

      // ✅ MAP ĐÚNG FIELD TRẢ VỀ TỪ BACKEND
      onChange({
        promotionId: data.promotionId,   // backend trả về 'promotionId'
        promotionCode: data.code,        // backend trả về 'code'
        discountAmount: data.discount,   // backend trả về 'discount'
        finalTotal: data.finalAmount,    // backend trả về 'finalAmount'
      });
    } catch (error) {
      console.error('apply coupon error:', error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Mã không hợp lệ'
      );

      // Reset về giá gốc
      onChange({
        promotionId: null,
        promotionCode: null,
        discountAmount: 0,
        finalTotal: totalAmount,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <label className="text-sm font-medium text-gray-700 block mb-2">
        Mã khuyến mãi
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input flex-1"
          placeholder="Nhập mã giảm giá"
        />

        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          className="btn btn-primary px-4"
        >
          {loading ? '...' : 'Áp dụng'}
        </button>
      </div>
    </div>
  );
};

export default PromoCodeBox;
