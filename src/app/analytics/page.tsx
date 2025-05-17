import { Metadata } from 'next';
import DepositAnalytics from '../analytics/DepositAnalytics';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dollarchain Analytics',
  description: 'User activity analytics for Dollarchain',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-8 pb-16 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          <span>Back to Home</span>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8 text-[#00C853]">Dollarchain Analytics</h1>
      
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Deposit Activity (48-Hour Window from First Deposit)</h2>
        <div className="h-[400px] w-full">
          <DepositAnalytics />
        </div>
      </div>
    </div>
  );
} 