import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Edit3,
  Trash2,
  PauseCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Star,
  Save,
  X,
} from 'lucide-react';
import { BankAccountDetails, BankAccountStatus } from '../../types';

export const SA_AND_GLOBAL_BANKS = [
  { name: 'Absa Bank', branchCode: '632005', swift: 'ABSAZAJJ' },
  { name: 'First National Bank (FNB)', branchCode: '250655', swift: 'FIRNZAJJ' },
  { name: 'Standard Bank', branchCode: '051001', swift: 'SBZAZAJJ' },
  { name: 'Nedbank', branchCode: '198765', swift: 'NEDSZAJJ' },
  { name: 'Capitec Bank', branchCode: '470010', swift: 'CABLZAJJ' },
  { name: 'Investec Bank', branchCode: '580105', swift: 'IVESZAJJ' },
  { name: 'Discovery Bank', branchCode: '679000', swift: 'DISCZAJJ' },
  { name: 'TymeBank', branchCode: '678910', swift: 'TYMEZAJJ' },
  { name: 'African Bank', branchCode: '430000', swift: 'AFRCZAJJ' },
  { name: 'Bidvest Bank', branchCode: '462005', swift: 'BIDVZAJJ' },
  { name: 'HSBC / Barclays International', branchCode: '584000', swift: 'MIDLGB22' },
  { name: 'Chase / Citibank Global USD', branchCode: '021000', swift: 'CHASUS33' },
];

interface ProfileBankAccountsManagerProps {
  accounts: BankAccountDetails[];
  defaultHolderName?: string;
  onChange: (updatedAccounts: BankAccountDetails[], primaryAccount?: BankAccountDetails) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  enteredInRegistrationDefault?: boolean;
}

export const ProfileBankAccountsManager: React.FC<ProfileBankAccountsManagerProps> = ({
  accounts,
  defaultHolderName = '',
  onChange,
  title = 'Bank Accounts & Payout / Debit Information',
  subtitle = 'Add, edit, delete, suspend, or pend bank accounts for instant EFT, payouts, and online banking.',
  compact = false,
  enteredInRegistrationDefault = false,
}) => {
  const [bankName, setBankName] = useState(SA_AND_GLOBAL_BANKS[0].name);
  const [accountName, setAccountName] = useState(defaultHolderName);
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState(SA_AND_GLOBAL_BANKS[0].branchCode);
  const [accountType, setAccountType] = useState('Cheque / Current');
  const [swiftCode, setSwiftCode] = useState(SA_AND_GLOBAL_BANKS[0].swift);
  const [status, setStatus] = useState<BankAccountStatus>('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(accounts.length === 0);
  const [formError, setFormError] = useState<string | null>(null);

  const normalizeAccounts = (list: BankAccountDetails[]): BankAccountDetails[] => {
    if (list.length === 0) return [];
    const hasPrimary = list.some((b) => b.isPrimary);
    return list.map((b, idx) => ({
      ...b,
      id: b.id || `ba-${idx}-${Date.now()}`,
      status: b.status || 'active',
      isPrimary: hasPrimary ? Boolean(b.isPrimary) : idx === 0,
    }));
  };

  const normalizedList = normalizeAccounts(accounts);

  const emitUpdate = (nextList: BankAccountDetails[]) => {
    const clean = normalizeAccounts(nextList);
    const primary =
      clean.find((b) => b.isPrimary && b.status === 'active') ||
      clean.find((b) => b.status === 'active') ||
      clean[0];
    onChange(clean, primary);
  };

  const handleBankSelect = (selectedName: string) => {
    setBankName(selectedName);
    const preset = SA_AND_GLOBAL_BANKS.find((b) => b.name === selectedName);
    if (preset) {
      setBranchCode(preset.branchCode);
      setSwiftCode(preset.swift);
    }
  };

  const resetForm = () => {
    setBankName(SA_AND_GLOBAL_BANKS[0].name);
    setAccountName(defaultHolderName || '');
    setAccountNumber('');
    setBranchCode(SA_AND_GLOBAL_BANKS[0].branchCode);
    setAccountType('Cheque / Current');
    setSwiftCode(SA_AND_GLOBAL_BANKS[0].swift);
    setStatus('active');
    setEditingId(null);
    setFormError(null);
  };

  const handleSaveAccount = () => {
    setFormError(null);
    const cleanHolder = (accountName || defaultHolderName || '').trim();
    const cleanAccNum = accountNumber.trim();
    const cleanBranch = branchCode.trim();

    if (!cleanHolder) {
      setFormError('Please enter the bank account holder name.');
      return;
    }
    if (!cleanAccNum || cleanAccNum.length < 5) {
      setFormError('Please enter a valid bank account number (at least 5 digits).');
      return;
    }

    if (editingId) {
      const updated = normalizedList.map((item) =>
        item.id === editingId
          ? {
              ...item,
              bankName,
              accountName: cleanHolder,
              accountNumber: cleanAccNum,
              branchCode: cleanBranch || '632005',
              accountType,
              swiftCode: swiftCode.trim(),
              status,
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      emitUpdate(updated);
      resetForm();
      setShowForm(false);
    } else {
      const newAcc: BankAccountDetails = {
        id: `ba-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        bankName,
        accountName: cleanHolder,
        accountNumber: cleanAccNum,
        branchCode: cleanBranch || '632005',
        accountType,
        swiftCode: swiftCode.trim(),
        status,
        isPrimary: normalizedList.length === 0,
        enteredInRegistration: enteredInRegistrationDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      emitUpdate([...normalizedList, newAcc]);
      resetForm();
      setShowForm(false);
    }
  };

  const handleStartEdit = (acc: BankAccountDetails) => {
    setEditingId(acc.id || null);
    setBankName(acc.bankName || SA_AND_GLOBAL_BANKS[0].name);
    setAccountName(acc.accountName || defaultHolderName || '');
    setAccountNumber(acc.accountNumber || '');
    setBranchCode(acc.branchCode || '632005');
    setAccountType(acc.accountType || 'Cheque / Current');
    setSwiftCode(acc.swiftCode || 'ABSAZAJJ');
    setStatus(acc.status || 'active');
    setFormError(null);
    setShowForm(true);
  };

  const handleDeleteAccount = (id?: string) => {
    if (!id) return;
    const remaining = normalizedList.filter((b) => b.id !== id);
    emitUpdate(remaining);
    if (editingId === id) {
      resetForm();
    }
  };

  const handleSetStatus = (id: string | undefined, nextStatus: BankAccountStatus) => {
    if (!id) return;
    const updated = normalizedList.map((b) =>
      b.id === id ? { ...b, status: nextStatus, updatedAt: new Date().toISOString() } : b
    );
    emitUpdate(updated);
  };

  const handleSetPrimary = (id?: string) => {
    if (!id) return;
    const updated = normalizedList.map((b) => ({
      ...b,
      isPrimary: b.id === id,
      updatedAt: new Date().toISOString(),
    }));
    emitUpdate(updated);
  };

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4 text-slate-100 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                {normalizedList.length} {normalizedList.length === 1 ? 'Account' : 'Accounts'}
              </span>
            </h4>
            {!compact && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm && editingId) {
              resetForm();
            } else {
              if (!accountName && defaultHolderName) setAccountName(defaultHolderName);
              setShowForm(!showForm);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
        >
          {showForm ? (
            <>
              <X className="h-3.5 w-3.5" /> Close Form
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> Add Bank Account
            </>
          )}
        </button>
      </div>

      {/* Existing Bank Accounts List with Add / Edit / Delete / Suspend / Pend / Activate controls */}
      {normalizedList.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {normalizedList.map((acc) => {
            const accStatus = acc.status || 'active';
            return (
              <div
                key={acc.id || acc.accountNumber}
                className={`rounded-xl border p-3 transition ${
                  accStatus === 'active'
                    ? 'border-emerald-500/30 bg-slate-950/80'
                    : accStatus === 'pending'
                    ? 'border-amber-500/40 bg-amber-950/20'
                    : 'border-rose-500/40 bg-rose-950/20'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{acc.bankName}</span>
                      {acc.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                          <Star className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" /> Primary
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          accStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : accStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {accStatus === 'active' && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {accStatus === 'pending' && <Clock className="h-2.5 w-2.5" />}
                        {accStatus === 'suspended' && <PauseCircle className="h-2.5 w-2.5" />}
                        {accStatus}
                      </span>
                      {acc.enteredInRegistration && (
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/30">
                          Registration Account
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      Holder: <span className="font-semibold text-white">{acc.accountName}</span> • Acc #:{' '}
                      <span className="font-mono font-semibold text-emerald-300">{acc.accountNumber}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Branch: {acc.branchCode} • Type: {acc.accountType}
                      {acc.swiftCode ? ` • SWIFT: ${acc.swiftCode}` : ''}
                    </p>
                  </div>

                  {/* Lifecycle Action Buttons: Edit, Activate, Pend, Suspend, Delete */}
                  <div className="flex flex-wrap items-center gap-1">
                    {!acc.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(acc.id)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
                        title="Set as Primary Bank Account"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(acc)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-300 hover:bg-blue-500/20"
                      title="Edit Bank Account"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    {accStatus !== 'active' && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(acc.id, 'active')}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                        title="Activate Bank Account"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Activate
                      </button>
                    )}
                    {accStatus !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(acc.id, 'pending')}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20"
                        title="Put Bank Account on Pending"
                      >
                        <Clock className="h-3 w-3" /> Pend
                      </button>
                    )}
                    {accStatus !== 'suspended' && (
                      <button
                        type="button"
                        onClick={() => handleSetStatus(acc.id, 'suspended')}
                        className="inline-flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold text-orange-300 hover:bg-orange-500/20"
                        title="Suspend Bank Account"
                      >
                        <PauseCircle className="h-3 w-3" /> Suspend
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/20"
                      title="Delete Bank Account"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Bank Account Form */}
      {showForm && (
        <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/90 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              {editingId ? 'Edit Bank Account Details' : 'Add Bank Account (Registration & Payout Ready)'}
            </span>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {formError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Select Bank</label>
              <select
                value={bankName}
                onChange={(e) => handleBankSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {SA_AND_GLOBAL_BANKS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={defaultHolderName || 'e.g. Mdluli Executive Stays / Full Name'}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 4098217364"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="632005"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  SWIFT / BIC
                </label>
                <input
                  type="text"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  placeholder="ABSAZAJJ"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Cheque / Current">Cheque / Current Account</option>
                <option value="Business Commercial">Business / Commercial Account</option>
                <option value="Savings">Savings / Transmission Account</option>
                <option value="Trust / Escrow">Trust / Escrow Account</option>
                <option value="Foreign Currency (CFC)">Foreign Currency Account (USD/EUR/GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Account Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BankAccountStatus)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="active">Active (Ready for Payments & Payouts)</option>
                <option value="pending">Pending Verification (On Hold)</option>
                <option value="suspended">Suspended (Temporarily Disabled)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveAccount}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
            >
              <Save className="h-3.5 w-3.5" />
              {editingId ? 'Save Bank Account Changes' : 'Save Bank Account to Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
