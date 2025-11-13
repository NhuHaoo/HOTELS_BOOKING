import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaCreditCard, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const MockPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const bookingCode = searchParams.get('bookingCode');
  const amount = searchParams.get('amount');
  const returnUrl = searchParams.get('returnUrl') || '/payment/return';

  const handlePayment = (success) => {
    setProcessing(true);
    
    setTimeout(() => {
      const params = new URLSearchParams({
        vnp_ResponseCode: success ? '00' : '24',
        vnp_TxnRef: bookingCode,
        vnp_Amount: amount * 100,
        vnp_BankCode: 'MOCKBANK',
        vnp_TransactionNo: Date.now(),
      });

      window.location.href = `${returnUrl}?${params.toString()}`;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCreditCard className="text-blue-600 text-4xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mock Payment Gateway
          </h1>
          <p className="text-gray-600">For testing purposes only</p>
        </div>

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking Code:</span>
              <span className="font-mono font-semibold">{bookingCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-blue-600">
                {parseInt(amount).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            ⚠️ This is a mock payment page for development. No real payment will be processed.
          </p>
        </div>

        {/* Actions */}
        {!processing ? (
          <div className="space-y-3">
            <button
              onClick={() => handlePayment(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaCheckCircle className="mr-2" />
              Simulate Success Payment
            </button>
            <button
              onClick={() => handlePayment(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg flex items-center justify-center transition-colors"
            >
              <FaTimesCircle className="mr-2" />
              Simulate Failed Payment
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing payment...</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Mock Payment Gateway v1.0 - Development Only
        </p>
      </div>
    </div>
  );
};

export default MockPayment;

