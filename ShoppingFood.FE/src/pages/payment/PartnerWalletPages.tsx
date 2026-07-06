import { useEffect, useState } from 'react';
import { Banknote, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { paymentService, type IWalletDto } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function SellerWalletPage() {
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });

  const loadWallet = () => {
    paymentService.getWallet().then(res => {
      if (!res.error && res.data) setWallet(res.data);
    });
  };

  useEffect(() => { loadWallet(); }, []);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || !withdrawForm.bankName || !withdrawForm.bankAccountNumber) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const res = await paymentService.requestWithdrawal({
      amount,
      bankName: withdrawForm.bankName,
      bankAccountNumber: withdrawForm.bankAccountNumber,
      bankAccountHolder: withdrawForm.bankAccountHolder,
    });
    if (!res.error) {
      toast.success('Yêu cầu rút tiền đã được gửi');
      loadWallet();
    } else {
      toast.error(res.message || 'Lỗi rút tiền');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Banknote className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-gray-500 text-sm">Số dư ví nhà hàng</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(wallet?.balance || 0)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ArrowDownCircle className="w-5 h-5" /> Rút tiền về ngân hàng
        </h3>
        <div className="space-y-3">
          <Input placeholder="Số tiền rút" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} />
          <Input placeholder="Tên ngân hàng" value={withdrawForm.bankName} onChange={e => setWithdrawForm(p => ({ ...p, bankName: e.target.value }))} />
          <Input placeholder="Số tài khoản" value={withdrawForm.bankAccountNumber} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
          <Input placeholder="Chủ tài khoản" value={withdrawForm.bankAccountHolder} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountHolder: e.target.value }))} />
          <Button onClick={handleWithdraw} className="w-full">Gửi yêu cầu rút tiền</Button>
        </div>
      </Card>
    </div>
  );
}

export function ShipperWalletPage() {
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });

  const loadWallet = () => {
    paymentService.getWallet().then(res => {
      if (!res.error && res.data) setWallet(res.data);
    });
  };

  useEffect(() => { loadWallet(); }, []);

  const handleRepay = async () => {
    const amount = parseFloat(repayAmount);
    if (!amount) return toast.error('Nhập số tiền');
    const res = await paymentService.repayShipperDebt(amount);
    if (!res.error) {
      toast.success(`Đã nộp ${formatCurrency(res.data?.repaid || amount)} công nợ COD`);
      loadWallet();
    } else toast.error(res.message || 'Lỗi');
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawForm.amount);
    const res = await paymentService.requestWithdrawal({
      amount,
      bankName: withdrawForm.bankName,
      bankAccountNumber: withdrawForm.bankAccountNumber,
      bankAccountHolder: withdrawForm.bankAccountHolder,
    });
    if (!res.error) { toast.success('Yêu cầu rút tiền đã gửi'); loadWallet(); }
    else toast.error(res.message || 'Lỗi');
  };

  const debtExceeded = (wallet?.codCollectedAmount || 0) >= (wallet?.debtLimit || 5000000);

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <p className="text-gray-500 text-sm">Số dư ví tài xế</p>
        <p className="text-3xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">COD thu hộ:</span> <strong>{formatCurrency(wallet?.codCollectedAmount || 0)}</strong></div>
          <div><span className="text-gray-500">Hạn mức:</span> <strong>{formatCurrency(wallet?.debtLimit || 0)}</strong></div>
        </div>
        {debtExceeded && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> Vượt hạn mức thu hộ COD. Vui lòng nộp tiền trước khi nhận đơn mới.
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Nộp tiền thu hộ COD (UC-PAY-014)</h3>
        <div className="flex gap-3">
          <Input placeholder="Số tiền nộp" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} />
          <Button onClick={handleRepay}>Nộp tiền</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Rút tiền về ngân hàng (UC-PAY-008)</h3>
        <div className="space-y-3">
          <Input placeholder="Số tiền" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value }))} />
          <Input placeholder="Ngân hàng" value={withdrawForm.bankName} onChange={e => setWithdrawForm(p => ({ ...p, bankName: e.target.value }))} />
          <Input placeholder="Số TK" value={withdrawForm.bankAccountNumber} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
          <Input placeholder="Chủ TK" value={withdrawForm.bankAccountHolder} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountHolder: e.target.value }))} />
          <Button onClick={handleWithdraw} className="w-full">Rút tiền</Button>
        </div>
      </Card>
    </div>
  );
}
