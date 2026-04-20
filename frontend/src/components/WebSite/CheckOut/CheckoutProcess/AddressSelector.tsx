"use client";

import { MapPin, Home, Briefcase, Star, Plus, Check } from "lucide-react";
import type { SavedAddress } from "@/services/addressService";

interface AddressSelectorProps {
  addresses: SavedAddress[];
  selectedId: string | null;
  useNewAddress: boolean;
  onSelect: (id: string) => void;
  onChooseNew: () => void;
  disabled?: boolean;
}

const TYPE_META: Record<string, { label: string; icon: typeof Home }> = {
  home: { label: "Home", icon: Home },
  work: { label: "Work", icon: Briefcase },
  other: { label: "Other", icon: MapPin },
};

export default function AddressSelector({
  addresses,
  selectedId,
  useNewAddress,
  onSelect,
  onChooseNew,
  disabled,
}: AddressSelectorProps) {
  if (addresses.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Ship to a saved address</h3>
        <span className="text-xs text-slate-500">{addresses.length} saved</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {addresses.map((addr) => {
          const meta = TYPE_META[addr.type] || TYPE_META.other;
          const Icon = meta.icon;
          const selected = !useNewAddress && selectedId === addr.id;
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelect(addr.id)}
              disabled={disabled}
              className={`relative text-left border-2 rounded-xl p-4 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                selected
                  ? "border-gray-800 bg-gradient-to-br from-gray-50 to-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              {selected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700 rounded-full">
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
                {addr.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-gray-800 text-white rounded-full">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">{addr.name}</p>
              <p className="text-xs text-slate-600 truncate">{addr.phone}</p>
              <p className="text-xs text-slate-700 mt-1 line-clamp-2">
                {addr.address}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}, {addr.city}, {addr.state} {addr.zipCode}
              </p>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onChooseNew}
          disabled={disabled}
          className={`relative text-left border-2 border-dashed rounded-xl p-4 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center justify-center gap-2 min-h-[140px] disabled:opacity-60 disabled:cursor-not-allowed ${
            useNewAddress
              ? "border-gray-800 bg-gray-50 text-gray-900"
              : "border-slate-300 bg-white text-slate-600 hover:border-slate-500 hover:text-slate-900"
          }`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-semibold">Use a new address</span>
        </button>
      </div>
    </div>
  );
}
