import {
  Truck,
  Mail,
  Star,
  Package,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import type { Driver } from "../../../types";

interface DriverProfileCardProps {
  driver: Driver;
  appCfg: { label: string; bg: string; text: string; icon: React.ElementType };
  onlineCfg: { label: string; bg: string; text: string; dot: string };
}

export function DriverProfileCard({
  driver,
  appCfg,
  onlineCfg,
}: DriverProfileCardProps) {
  const application = driver.application;

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="h-24 bg-gradient-to-r from-brand/80 to-brand-light/80" />
        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4">
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-xl bg-gray-50 flex items-center justify-center">
                <Truck className="w-10 h-10 text-gray-300" />
              </div>
            </div>
            <div
              className={`absolute bottom-1 left-20 w-5 h-5 rounded-full border-4 border-white ${onlineCfg.dot}`}
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              {application
                ? `${application.firstName} ${application.familyName}`
                : "Unregistered Driver"}
            </h2>
            <div className="flex items-center gap-2 text-gray-500">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{driver.email}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${appCfg.bg} ${appCfg.text}`}
            >
              <appCfg.icon className="w-3.5 h-3.5" />
              {appCfg.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${onlineCfg.bg} ${onlineCfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${onlineCfg.dot}`} />
              {onlineCfg.label}
            </span>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Package className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Deliveries
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {driver._count?.deliveries || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Rating
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {driver.rating ? Number(driver.rating).toFixed(1) : "5.0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider px-1">
          Quick Actions
        </h3>
        <div className="grid gap-2">
          <button className="flex items-center justify-between p-3 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
            View Order History
            <ExternalLink className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-between p-3 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
            Earnings Report
            <DollarSign className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
