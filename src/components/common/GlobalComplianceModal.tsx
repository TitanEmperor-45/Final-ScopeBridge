/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Globe, CreditCard, Lock, FileText, CheckCircle2, AlertCircle, Scale } from 'lucide-react';

interface GlobalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalComplianceModal({ isOpen, onClose }: GlobalComplianceModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'privacy' | 'hospitality'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Global Regulatory & Legal Compliance Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                South African (POPIA, CPA, SARS), American (CCPA, FTC, PCI-DSS), & European (GDPR, PSD2, EU Directives) Standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" /> Jurisdictions & Frameworks
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payments & Financial Regulations
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" /> Data Privacy & Protection (POPIA/GDPR)
          </button>
          <button
            onClick={() => setActiveTab('hospitality')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'hospitality'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800/80 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Hospitality & Consumer Rights
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" /> Multi-Jurisdiction Legal Compliance Architecture
              </h3>
              <p>
                StaySync ScopeBridg operates globally under strict adherence to statutory frameworks governing international hospitality, electronic communications, and financial settlements across South Africa, the United States, and the European Union.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">🇿🇦 South Africa</h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li>• <strong>POPIA</strong> (Act No. 4 of 2013) - Data Protection</li>
                    <li>• <strong>CPA</strong> (Act No. 68 of 2008) - Consumer Rights</li>
                    <li>• <strong>SARS VAT Act</strong> (No. 89 of 1991) - 15% Tax Compliance</li>
                    <li>• FICA AML Standards</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">🇪🇺 European Union</h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li>• <strong>GDPR</strong> (Regulation EU 2016/679)</li>
                    <li>• <strong>PSD2</strong> (Strong Customer Authentication)</li>
                    <li>• EU Consumer Rights Directive</li>
                    <li>• ePrivacy Regulation Standards</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">🇺🇸 United States</h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li>• <strong>CCPA / CPRA</strong> (California Privacy)</li>
                    <li>• FTC Act Section 5 (Truth in Advertising)</li>
                    <li>• PCI-DSS Level 1 Compliance</li>
                    <li>• State Short-Term Rental Ordinances</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Processing & Financial Regulations
              </h3>
              <p>
                All financial transactions, currency conversions, payouts, and digital wallet settlements adhere to rigorous international banking and tax bylaws:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white text-xs">PCI-DSS Level 1 Security</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Card data is tokenized and securely handled via certified merchant gateways (Paystack, Ozow, Yoco, Stripe). No raw credit card data is ever stored on local servers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white text-xs">PSD2 Strong Customer Authentication (SCA)</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Mandates multi-factor authentication (OTP verification) for European and international digital payments to prevent fraudulent transactions and unauthorized card usage.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white text-xs">SARS & International Tax Compliance</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Automatic 15% South African VAT calculation on taxable hospitality services, with itemized tax invoices generated for corporate and leisure bookings in compliance with global tax authorities.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" /> Data Privacy, POPIA & GDPR Compliance
              </h3>
              <p>
                We enforce a Zero-Trust data architecture giving users absolute ownership and control over their personal information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Right to Access & Rectification</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Users can inspect, export, or update all personal data, booking history, and profile credentials directly from their account portal at any time.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Right to be Forgotten (Erasure)</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">In compliance with GDPR Article 17 and POPIA Section 24, users may request permanent erasure of their personal data, subject to statutory financial record-keeping retention bylaws.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hospitality' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Hospitality Bylaws & Consumer Protection
              </h3>
              <p>
                Bookings, cancellations, and host-guest dispute resolutions are governed by transparent consumer protection laws:
              </p>
              <ul className="space-y-2 text-xs list-disc list-inside text-slate-600 dark:text-slate-400">
                <li><strong>Consumer Protection Act (CPA)</strong>: Fair cancellation policies, transparent pricing with no hidden mandatory fees, and guaranteed property description accuracy.</li>
                <li><strong>Short-Term Rental Zoning Bylaws</strong>: Compliance with municipal residential leasing limits, HOA regulations, and tourist tax reporting across operational regions.</li>
                <li><strong>Childcare & Transport Safety</strong>: Vetting standards for certified nannies (background checks, CPR certificates) and PDP-licensed executive chauffeur fleets.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Certified Secure & Globally Compliant
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}
