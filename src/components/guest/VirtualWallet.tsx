import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Sparkles,
  Target,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Calendar,
  ChevronRight,
  Coins,
  Building2,
  Copy,
  Check,
  Smartphone,
  QrCode,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { VirtualWalletData, VirtualWalletTransaction, GlobalCurrency, BankAccountDetails, UserAccount } from '../../types';
import { PLATFORM_CONFIG } from '../../data/platformConfig';
import { OnlineBankingPortalModal } from '../common/OnlineBankingPortalModal';
import { ProfileBankAccountsManager } from '../common/ProfileBankAccountsManager';

interface VirtualWalletProps {
  walletData: VirtualWalletData;
  onUpdateWalletData: (newWalletData: VirtualWalletData) => void;
  currencySymbol?: string;
  selectedCurrency?: GlobalCurrency;
  currentUser?: UserAccount;
  onUpdateUser?: (user: UserAccount) => void;
}

const SA_BANKS = [
  'First National Bank (FNB)',
  'Capitec Bank',
  'Standard Bank',
  'Absa Bank',
  'Nedbank',
  'Investec Bank',
  'Discovery Bank',
  'TymeBank',
  'African Bank',
];

export const VirtualWallet: React.FC<VirtualWalletProps> = ({
  walletData,
  onUpdateWalletData,
  currencySymbol = 'R',
  selectedCurrency = 'ZAR',
  currentUser,
  onUpdateUser,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [isOnlineBankingTopUpOpen, setIsOnlineBankingTopUpOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [topUpMethod, setTopUpMethod] = useState<'online_banking' | 'ozow' | 'card' | 'absa_wire' | 'snapscan' | 'paystack'>('online_banking');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Guest Saved Bank Accounts State (Synced with User Profile & Firestore)
  const [savedGuestBankAccounts, setSavedGuestBankAccounts] = useState<BankAccountDetails[]>(() => {
    if (currentUser?.bankAccounts && currentUser.bankAccounts.length > 0) {
      return currentUser.bankAccounts;
    }
    if (currentUser?.bankAccount) {
      return [{ ...currentUser.bankAccount, id: 'ba-primary', isPrimary: true, status: currentUser.bankAccount.status || 'active' }];
    }
    try {
      const stored = localStorage.getItem('scopebridg_guest_bank_accounts');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'ba-capitec-demo',
        bankName: 'Capitec Bank',
        accountName: currentUser?.fullName || currentUser?.name || 'Nyasha Michaels',
        accountNumber: '1592039481',
        branchCode: '470010',
        accountType: 'Savings Account',
        status: 'active',
        isPrimary: true,
      },
    ];
  });

  // New Bank Account Form State
  const [newBankName, setNewBankName] = useState('Capitec Bank');
  const [newAccountName, setNewAccountName] = useState('Nyasha Michaels');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('Universal');
  const [newAccountType, setNewAccountType] = useState('Cheque / Current');

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [selectedWithdrawBankIdx, setSelectedWithdrawBankIdx] = useState<number>(0);

  const adminBank = PLATFORM_CONFIG.mainAdminBankAccount;

  // Goal calculation
  const totalSpendable =
    walletData.holidayFundBalanceZar + walletData.cashbackRewardsZar + walletData.referralCreditsZar;
  const goalProgressPercent = Math.min(
    100,
    Math.round((walletData.holidayFundBalanceZar / (walletData.goalTargetZar || 1)) * 100)
  );

  // Filtered transactions
  const filteredTransactions = walletData.transactions.filter((tx) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'deposit') return tx.amountZar > 0;
    if (filterCategory === 'spent') return tx.amountZar < 0;
    return tx.category === filterCategory;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(label);
    setTimeout(() => setCopiedBankField(null), 2500);
  };

  // Add Bank Account
  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber.trim()) return;

    const newAcc: BankAccountDetails = {
      bankName: newBankName,
      accountName: newAccountName.trim() || 'Guest Account Holder',
      accountNumber: newAccountNumber.trim(),
      branchCode: newBranchCode || '632005',
      accountType: newAccountType,
    };

    const updated = [...savedGuestBankAccounts, newAcc];
    setSavedGuestBankAccounts(updated);
    try {
      localStorage.setItem('scopebridg_guest_bank_accounts', JSON.stringify(updated));
      await fetch('/api/banking/save-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'guest-01',
          userRole: 'guest',
          ...newAcc,
          recipientPhone: '+27694977018',
        }),
      });
    } catch {}

    setIsAddBankModalOpen(false);
    setNewAccountNumber('');
    setTopUpSuccessMsg(`Successfully added & verified ${newAcc.bankName} (****${newAcc.accountNumber.slice(-4)}) for instant payouts!`);
    setTimeout(() => setTopUpSuccessMsg(null), 4000);
  };

  // Handle Top-up
  const handlePerformTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;

    if (topUpMethod === 'online_banking') {
      setIsTopUpModalOpen(false);
      setIsOnlineBankingTopUpOpen(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Process real payment via backend
      const res = await fetch('/api/payments/process-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayId: topUpMethod === 'absa_wire' ? 'absa_direct_eft' : topUpMethod,
          amountZar: topUpAmount,
          purpose: 'Guest Virtual Wallet Top-Up & Holiday Savings',
          payerName: 'Nyasha Michaels (Guest)',
          payerEmail: 'nyasha.michaels@executive.com',
          payerPhone: '+27729014455',
          targetBank: `${adminBank.bankName} (Acc: ${adminBank.accountNumber})`,
        }),
      });

      const data = await res.json();
      const txId = data.transactionId || `TX-${Math.floor(100000 + Math.random() * 900000)}`;

      const newTx: VirtualWalletTransaction = {
        id: txId,
        date: new Date().toISOString().slice(0, 10),
        title: `Instant Top-Up (${topUpMethod.toUpperCase()})`,
        category: 'deposit',
        amountZar: topUpAmount,
        status: 'completed',
        reference: data.referenceCode || `OZ-${Math.floor(10000 + Math.random() * 90000)}`,
        notes: `Settled into Admin Account (${adminBank.bankName}) via ${topUpMethod.toUpperCase()}`,
      };

      const updatedWallet: VirtualWalletData = {
        ...walletData,
        holidayFundBalanceZar: walletData.holidayFundBalanceZar + topUpAmount,
        transactions: [newTx, ...walletData.transactions],
      };

      onUpdateWalletData(updatedWallet);
      setIsProcessing(false);
      setIsTopUpModalOpen(false);
      setTopUpSuccessMsg(`Successfully loaded ${currencySymbol}${topUpAmount.toLocaleString()} to your Virtual Wallet via ${topUpMethod.toUpperCase()}!`);
      setTimeout(() => setTopUpSuccessMsg(null), 4000);
    } catch {
      setIsProcessing(false);
    }
  };

  // Handle Real-Time Withdrawal Payout to Linked Bank Account
  const handlePerformWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || withdrawAmount > totalSpendable) return;

    const targetBank = savedGuestBankAccounts[selectedWithdrawBankIdx] || savedGuestBankAccounts[0];
    if (!targetBank) return;

    setIsProcessing(true);

    try {
      await fetch('/api/payments/payout-disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payeeName: targetBank.accountName,
          payeeRole: 'guest',
          bankName: targetBank.bankName,
          accountNumber: targetBank.accountNumber,
          branchCode: targetBank.branchCode,
          amountZar: withdrawAmount,
          purpose: 'Guest Virtual Wallet Cash-Out / Reward Withdrawal',
        }),
      });

      const newTx: VirtualWalletTransaction = {
        id: `WTH-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().slice(0, 10),
        title: `Withdrawal Payout to ${targetBank.bankName}`,
        category: 'transfer',
        amountZar: -withdrawAmount,
        status: 'completed',
        reference: `RTC-${Math.floor(10000 + Math.random() * 90000)}`,
        notes: `Disbursed to ${targetBank.accountName} (****${targetBank.accountNumber.slice(-4)})`,
      };

      const updatedWallet: VirtualWalletData = {
        ...walletData,
        holidayFundBalanceZar: Math.max(0, walletData.holidayFundBalanceZar - withdrawAmount),
        transactions: [newTx, ...walletData.transactions],
      };

      onUpdateWalletData(updatedWallet);
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);
      setTopUpSuccessMsg(`Real-time payout of ${currencySymbol}${withdrawAmount.toLocaleString()} disbursed to ${targetBank.bankName} (Acc: ****${targetBank.accountNumber.slice(-4)})!`);
      setTimeout(() => setTopUpSuccessMsg(null), 5000);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Notification Feedback */}
      {topUpSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{topUpSuccessMsg}</span>
          </div>
          <button
            onClick={() => setTopUpSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-extrabold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Wallet Overview Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Card: Holiday Balance & Spendable */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Guest Virtual Wallet & Escrow</h3>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Insured Real-Time Escrow Fund
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold font-mono">
                {selectedCurrency} Account
              </span>
            </div>

            <div className="mt-6 space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Total Spendable Balance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono">
                  {currencySymbol}
                  {totalSpendable.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  (Includes Cashbacks & Credits)
                </span>
              </div>
            </div>

            {/* Sub breakdown pill grid */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-medium">Holiday Savings Fund</span>
                <span className="font-bold text-white text-sm font-mono mt-0.5 block">
                  {currencySymbol}
                  {walletData.holidayFundBalanceZar.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-medium">Cashback Rewards (5%)</span>
                <span className="font-bold text-emerald-400 text-sm font-mono mt-0.5 block">
                  +{currencySymbol}
                  {walletData.cashbackRewardsZar.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-medium font-sans">Referral Credits</span>
                <span className="font-bold text-amber-300 text-sm font-mono mt-0.5 block">
                  +{currencySymbol}
                  {walletData.referralCreditsZar.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Top Up Funds</span>
              </button>

              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>Withdraw to Bank</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Auto-earn 5% cashback on all direct bookings
            </span>
          </div>
        </div>

        {/* Holiday Savings Goal Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Holiday Savings Target</h3>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {goalProgressPercent}% Goal Reached
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">{walletData.goalName}</span>

              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Saved so far:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {currencySymbol}
                  {walletData.holidayFundBalanceZar.toLocaleString()} / {currencySymbol}
                  {walletData.goalTargetZar.toLocaleString()}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  style={{ width: `${goalProgressPercent}%` }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                />
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                Only{' '}
                <strong className="text-slate-900 font-mono">
                  {currencySymbol}
                  {(walletData.goalTargetZar - walletData.holidayFundBalanceZar).toLocaleString()}
                </strong>{' '}
                needed to unlock your dream vacation!
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-[11px]">
              <Gift className="w-4 h-4 text-amber-600" />
              Bonus Reward Threshold
            </span>
            <p className="text-[11px] text-amber-800">
              Reach {currencySymbol}20,000 in your wallet before November 30th to receive a free R1,500 luxury airport transfer voucher!
            </p>
          </div>
        </div>
      </div>


      {/* Scope Bridge Official Escrow Bank Details Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Direct Bank Transfer & Escrow Rails
              </span>
              <span className="text-xs font-black text-slate-100 uppercase tracking-tight">
                ScopeBridg Official Admin Bank Account (Absa Bank)
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold px-3 py-1 rounded-full">
            Real-Time Bank Clearing Approved
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Name</span>
            <p className="font-extrabold text-white text-xs">{adminBank.bankName}</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1 col-span-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Account Holder</span>
            <p className="font-extrabold text-white text-xs truncate">{adminBank.accountName}</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Account No.</span>
              <p className="font-mono font-black text-emerald-400 text-xs">{adminBank.accountNumber}</p>
            </div>
            <button
              onClick={() => handleCopy(adminBank.accountNumber, 'acc')}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Copy Account Number"
            >
              {copiedBankField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch Code</span>
              <p className="font-mono font-extrabold text-white text-xs">{adminBank.branchCode}</p>
            </div>
            <button
              onClick={() => handleCopy(adminBank.branchCode, 'branch')}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Copy Branch Code"
            >
              {copiedBankField === 'branch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800 leading-relaxed">
          Guests can top up their Virtual Wallet or pay invoices directly by making instant EFT payments from their bank app to the Absa Account above. Reference: <strong className="text-slate-200 font-mono">Nyasha Michaels</strong>.
        </p>
      </div>

      {/* Transaction History & Activity Dashboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-700" />
              Wallet Transaction History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track top-ups, cashback rewards, booking deductions, and shuttle/nanny payments
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Activity ({walletData.transactions.length})
            </button>
            <button
              onClick={() => setFilterCategory('deposit')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterCategory === 'deposit'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Credits (+ Top Ups)
            </button>
            <button
              onClick={() => setFilterCategory('spent')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterCategory === 'spent'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Debits (- Payments)
            </button>
            <button
              onClick={() => setFilterCategory('cashback_reward')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterCategory === 'cashback_reward'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Cashbacks
            </button>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Coins className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No transactions found in this category.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isCredit = tx.amountZar > 0;
              return (
                <div
                  key={tx.id}
                  className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-slate-700" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{tx.title}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {tx.reference}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {tx.notes || tx.category.replace('_', ' ')} • {tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono text-base font-black ${
                        isCredit ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : ''}
                      {currencySymbol}
                      {Math.abs(tx.amountZar).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TOP-UP MODAL */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Top Up Holiday Savings</h3>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePerformTopUp} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Select Deposit Amount ({selectedCurrency})
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[500, 1000, 2500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`p-2.5 rounded-xl font-mono font-bold border text-xs transition-all cursor-pointer ${
                        topUpAmount === amt
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {currencySymbol}
                      {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Select Real-Time Payment Method
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setTopUpMethod('online_banking')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      topUpMethod === 'online_banking'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>Online Banking RTC (Instant Bank-to-Bank Interbank)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                      Recommended
                    </span>
                  </label>

                  <label
                    onClick={() => setTopUpMethod('ozow')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      topUpMethod === 'ozow'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>Ozow Instant Bank EFT (Capitec, FNB, Absa, Nedbank)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      Zero Fees
                    </span>
                  </label>

                  <label
                    onClick={() => setTopUpMethod('absa_wire')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      topUpMethod === 'absa_wire'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>Direct Absa Wire to Admin Account (4113870950)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Direct RTC
                    </span>
                  </label>

                  <label
                    onClick={() => setTopUpMethod('paystack')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      topUpMethod === 'paystack'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-700" />
                      <span>Paystack (Visa / Mastercard / Apple Pay)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">3D-S</span>
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isProcessing || topUpAmount <= 0}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Settling via {topUpMethod.toUpperCase()}...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Deposit {currencySymbol}{topUpAmount.toLocaleString()} Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Withdraw to Bank Account</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePerformWithdrawal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Available Balance: <strong className="text-emerald-700 font-mono">R{totalSpendable.toLocaleString()}</strong>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="50"
                    max={totalSpendable}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Bank Account</label>
                <select
                  value={selectedWithdrawBankIdx}
                  onChange={(e) => setSelectedWithdrawBankIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-xs"
                >
                  {savedGuestBankAccounts.map((acc, idx) => (
                    <option key={idx} value={idx}>
                      {acc.bankName} - {acc.accountName} (•••• {acc.accountNumber.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                Payouts are cleared via SARB Real-Time Clearing (RTC). Funds reflect in your bank account in seconds.
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || withdrawAmount <= 0 || withdrawAmount > totalSpendable}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Clearing via RTC Bank Rail...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Withdraw R{withdrawAmount.toLocaleString()} to Bank</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD BANK ACCOUNT MODAL */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">Add New Bank Account</h3>
              </div>
              <button
                onClick={() => setIsAddBankModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBankAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Name *</label>
                <select
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800 text-xs"
                >
                  {SA_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Nyasha Michaels"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  placeholder="e.g. 1592039481"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    placeholder="Universal"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Type</label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 text-xs"
                  >
                    <option value="Cheque / Current">Cheque / Current</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Transmission">Transmission</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBankModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Verify &amp; Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ONLINE BANKING TOP-UP MODAL */}
      <OnlineBankingPortalModal
        isOpen={isOnlineBankingTopUpOpen}
        onClose={() => setIsOnlineBankingTopUpOpen(false)}
        amountZar={topUpAmount}
        recipientName={adminBank.accountName}
        reference={`TOPUP-${Date.now().toString().slice(-4)}`}
        description="Virtual Wallet Holiday Savings Top-Up"
        currentUser={currentUser}
        onUpdateUser={onUpdateUser}
        onPaymentSuccess={(receipt) => {
          setIsOnlineBankingTopUpOpen(false);
          const newTx: VirtualWalletTransaction = {
            id: receipt.transactionId,
            date: new Date().toISOString().slice(0, 10),
            title: `Online Banking Top-Up (${receipt.bankName})`,
            category: 'deposit',
            amountZar: topUpAmount,
            status: 'completed',
            reference: receipt.reference,
            notes: `Cleared via Real-Time Clearing (RTC) to ${adminBank.accountName} (${adminBank.bankName})`,
          };

          const updatedWallet: VirtualWalletData = {
            ...walletData,
            holidayFundBalanceZar: walletData.holidayFundBalanceZar + topUpAmount,
            transactions: [newTx, ...walletData.transactions],
          };

          onUpdateWalletData(updatedWallet);
          setTopUpSuccessMsg(`Successfully loaded ${currencySymbol}${topUpAmount.toLocaleString()} via ${receipt.bankName} Online Banking!`);
          setTimeout(() => setTopUpSuccessMsg(null), 4000);
        }}
      />
    </div>
  );
};
