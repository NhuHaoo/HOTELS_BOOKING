// frontend/src/components/PromoCodeBox.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotionAPI } from '../api/promotion.api';
import toast from 'react-hot-toast';
import { FaTag, FaCopy } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';

const PromoCodeBox = ({ totalAmount, onChange }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch danh sách mã giảm giá active
  const { data: activeCoupons } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: () =>
      promotionAPI
        .getActiveCoupons()
        .then((res) => res.data?.data || res.data || []),
  });

  const handleApply = async (couponCode = null) => {
    const codeToApply = couponCode || code.trim();
    
    if (!codeToApply) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }

    try {
      setLoading(true);

      // Nếu click từ danh sách, tự động điền vào input
      if (couponCode) {
        setCode(couponCode);
      }

      // ✅ GỌI ĐÚNG CÁCH: truyền object { code, totalAmount }
      const res = await promotionAPI.applyCoupon({
        code: codeToApply,
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

  const handleCopyCode = (couponCode) => {
    navigator.clipboard.writeText(couponCode);
    toast.success('Đã sao chép mã!');
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
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
        />

        <button
          type="button"
          onClick={() => handleApply()}
          disabled={loading}
          className="btn btn-primary px-4"
        >
          {loading ? '...' : 'Áp dụng'}
        </button>
      </div>

      {/* Danh sách mã giảm giá active */}
      {activeCoupons && activeCoupons.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">
            Mã khuyến mãi đang áp dụng:
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeCoupons.map((coupon) => (
              <div
                key={coupon._id || coupon.code}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg hover:border-orange-300 transition-all cursor-pointer group"
                onClick={() => handleApply(coupon.code)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FaTag className="text-orange-500 text-xs" />
                    <span className="font-mono font-bold text-orange-700 text-sm">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(coupon.code);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-orange-200 rounded"
                      title="Sao chép mã"
                    >
                      <FaCopy className="text-xs text-orange-600" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    {coupon.discountType === 'percent' ? (
                      <span>
                        Giảm <strong className="text-orange-600">{coupon.discountValue}%</strong>
                        {coupon.minOrderAmount > 0 && (
                          <span> cho đơn từ {formatPrice(coupon.minOrderAmount)}</span>
                        )}
                      </span>
                    ) : (
                      <span>
                        Giảm <strong className="text-orange-600">{formatPrice(coupon.discountValue)}</strong>
                        {coupon.minOrderAmount > 0 && (
                          <span> cho đơn từ {formatPrice(coupon.minOrderAmount)}</span>
                        )}
                      </span>
                    )}
                  </div>
                  {coupon.endDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      HSD: {new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(coupon.code);
                  }}
                  disabled={loading}
                  className="ml-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Áp dụng
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeBox;
