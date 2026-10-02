import React from 'react';
import { X, ShieldCheck, FileCheck } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <FileCheck className="w-5 h-5 text-sky-400" />
            Terms and Conditions
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-3 text-sm text-slate-300 max-h-80 overflow-y-auto pr-2">
          <p>
            Welcome to the Campus Smart Maintenance and Predictive Complaint Management System. By accessing or submitting complaints, you agree to these terms:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li>Reports submitted must represent genuine physical faults or hazards on campus premises.</li>
            <li>False, abusive, or spam reports may lead to account suspension and disciplinary review.</li>
            <li>Uploaded images must only depict the reported maintenance issue.</li>
            <li>Urgency levels generated via automatic keyword screening and Groq AI classification are binding for technician response times.</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-md"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-md max-w-lg w-full p-6 text-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-lg font-semibold text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Privacy Policy
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4 space-y-3 text-sm text-slate-300 max-h-80 overflow-y-auto pr-2">
          <p>
            Your privacy is strictly guarded within the campus operations infrastructure:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li>User email and departmental affiliation are accessed solely for operational assignment and status alerts.</li>
            <li>Complaint text submitted for AI processing does not contain sensitive personal data.</li>
            <li>Passwords are hashed using BCrypt at work factor 12 before persistence.</li>
            <li>Activity logs and transition audits are retained for operational accountability.</li>
          </ul>
        </div>
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
