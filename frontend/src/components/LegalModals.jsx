import React from 'react';
import { X, ShieldCheck, FileCheck } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
      <div className="bg-white border border-neutral-900 rounded-sm max-w-lg w-full p-6 text-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono">
            <FileCheck className="w-4 h-4 text-sky-600" />
            Terms & Conditions
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-neutral-400 hover:text-neutral-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-3 text-xs text-neutral-600 max-h-80 overflow-y-auto pr-2 leading-relaxed">
          <p>
            Welcome to CampusOps. By accessing or submitting complaints, you agree to these operational standards:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-neutral-600">
            <li>Reports submitted must represent genuine physical faults or hazards on campus premises.</li>
            <li>False, abusive, or spam reports may lead to account suspension and disciplinary review.</li>
            <li>Uploaded images must only depict the reported maintenance issue.</li>
            <li>Urgency levels generated via automatic keyword screening and Groq AI classification are binding for technician response times.</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-neutral-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full cursor-pointer shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm">
      <div className="bg-white border border-neutral-900 rounded-sm max-w-lg w-full p-6 text-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Privacy Policy
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-neutral-400 hover:text-neutral-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-3 text-xs text-neutral-600 max-h-80 overflow-y-auto pr-2 leading-relaxed">
          <p>
            Your privacy is strictly guarded within the campus operations infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-neutral-600">
            <li>User email and departmental affiliation are accessed solely for operational assignment and status alerts.</li>
            <li>Complaint text submitted for AI processing does not contain sensitive personal data.</li>
            <li>Passwords are hashed using BCrypt at work factor 12 before persistence.</li>
            <li>Activity logs and transition audits are retained for operational accountability.</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-neutral-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-full cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
