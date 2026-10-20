import React from 'react';
import { X, ShieldAlert, Phone, Hospital, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface GuestEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestEmergencyModal: React.FC<GuestEmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const emergencyContacts = [
    {
      title: 'Randburg SAPS (Police Station)',
      number: '011 449 9000',
      alt: '10111',
      desc: 'Local sector police station on Kensington B / Bram Fischer Dr',
      badge: '24/7 Police',
      type: 'police',
    },
    {
      title: '24/7 Armed Patrol Response',
      number: '011 789 2000',
      alt: 'BMA & Fidelity ADT',
      desc: 'Rapid armed patrol dedicated to Ferndale residential sector',
      badge: 'Sector Security',
      type: 'security',
    },
    {
      title: 'Netcare Olivedale Hospital',
      number: '011 777 2000',
      alt: 'Accident & Emergency',
      desc: 'Private emergency trauma center (10 mins down Windsor Way)',
      badge: '24/7 Trauma Unit',
      type: 'medical',
    },
    {
      title: 'Mediclinic Sandton',
      number: '011 709 2000',
      alt: 'Peter Place Bryanston',
      desc: 'Major multi-specialist private hospital & pediatric emergency',
      badge: 'Private Hospital',
      type: 'medical',
    },
    {
      title: 'National Ambulance & Medical Rescue',
      number: '10177',
      alt: '082 911 (Netcare 911)',
      desc: 'Paramedic rapid response and trauma evacuation',
      badge: 'Emergency Rescue',
      type: 'medical',
    },
    {
      title: 'City Power Faults & Inverter Support',
      number: '0860 562 874',
      alt: 'WhatsApp Host Direct',
      desc: 'All units include automatic solar + lithium inverters for uninterrupted power',
      badge: 'Solar Active',
      type: 'utilities',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Safety & 24/7 Emergency Hub</h2>
              <p className="text-xs text-slate-600">Immediate telephone directory for emergency services in Ferndale & Randburg</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <p>
              <strong>Gated & Monitored Security:</strong> All Ferndale properties feature high perimeter walls, electric fencing, CCTV coverage, and Yale digital smart locks with unique guest PINs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {contact.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{contact.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{contact.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <a
                      href={`tel:${contact.number.replace(/\s+/g, '')}`}
                      className="text-xs font-bold text-slate-900 hover:text-rose-600 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-rose-600" />
                      {contact.number}
                    </a>
                    {contact.alt && (
                      <span className="text-[11px] text-slate-400 block font-mono">Alt: {contact.alt}</span>
                    )}
                  </div>
                  <a
                    href={`tel:${contact.number.replace(/\s+/g, '')}`}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Call Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
