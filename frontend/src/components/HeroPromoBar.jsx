import { useQuery } from '@tanstack/react-query';
import { promotionAPI } from '../api/promotion.api';
import { FaTag } from 'react-icons/fa';

const HeroPromoBar = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: () =>
      promotionAPI
        .getActiveCoupons()
        .then((res) => res.data?.data || res.data),
  });

  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-3 w-full">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
        <FaTag className="text-sm text-orange-500" />
        <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap overflow-x-auto no-scrollbar text-xs sm:text-sm">
            {data.map((coupon, index) => (
              <span key={coupon.code} className="mr-4 inline-flex items-center">
                <span className="px-1.5 py-0.5 rounded bg-white border border-orange-300 text-[11px] font-semibold text-orange-600">
                  {coupon.code}
                </span>
                <span className="ml-1 text-slate-700">
                  {coupon.title || coupon.description}
                </span>
                {index < data.length - 1 && (
                  <span className="mx-2 text-slate-300">|</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <span className="hidden sm:inline text-[11px] text-orange-600 font-medium">
          Dùng mã ở bước thanh toán
        </span>
      </div>
    </div>
  );
};

export default HeroPromoBar;
