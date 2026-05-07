import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllZones,
  deleteZone,
  updateZone,
  type Zone,
} from "../api/zones.api";
import {
  MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Building2, Users, ChevronRight, AlertTriangle, Loader2
} from "lucide-react";

const ZonesPage: React.FC = () => {
  const navigate = useNavigate();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadZones = useCallback(async () => {
    try {
      const data = await fetchAllZones();
      setZones(data);
      setError(null);
    } catch {
      setError("Failed to load zones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleToggleActive = async (zone: Zone) => {
    setTogglingId(zone.id);
    try {
      await updateZone(zone.id, { isActive: !zone.isActive });
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, isActive: !z.isActive } : z))
      );
    } catch {
      alert("Failed to toggle zone status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteZone(id);
      setZones((prev) => prev.filter((z) => z.id !== id));
      setDeleteConfirm(null);
    } catch {
      alert("Failed to delete zone.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
            <MapPin size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Delivery Zones</h1>
            <p className="text-sm text-gray-500 mt-1">Manage polygon-based delivery areas</p>
          </div>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand-dark transition-all shadow-sm shadow-brand/20 active:scale-[0.98]"
          onClick={() => navigate("/zones/new")}
        >
          <Plus size={18} />
          New Zone
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Zones", value: zones.length, color: "text-gray-900" },
          { label: "Active", value: zones.filter((z) => z.isActive).length, color: "text-green-600" },
          { label: "Inactive", value: zones.filter((z) => !z.isActive).length, color: "text-gray-400" },
          { label: "Stores Assigned", value: zones.reduce((acc, z) => acc + (z._count?.storeZones ?? 0), 0), color: "text-brand" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
          <p className="text-gray-500 font-medium tracking-tight">Loading zones…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-3xl border border-red-100 text-center px-6">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
            <AlertTriangle size={28} />
          </div>
          <p className="text-red-800 font-semibold text-lg mb-2">{error}</p>
          <button 
            onClick={() => { setLoading(true); loadZones(); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 border-dashed text-center px-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
            <MapPin size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No delivery zones found</h3>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
            Create your first delivery zone by drawing a polygon on the map to define where your drivers operate.
          </p>
          <button 
            onClick={() => navigate("/zones/new")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-brand-dark transition-all active:scale-[0.98]"
          >
            <Plus size={18} /> Create First Zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <div key={zone.id} className={`group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${!zone.isActive ? "opacity-75 grayscale-[0.5]" : ""}`}>
              {/* Color bar */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: zone.color || "#F97316" }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand transition-colors line-clamp-1">{zone.name}</h3>
                    <p className="text-xs font-semibold text-gray-400 flex items-center gap-1 mt-1 uppercase tracking-wide">
                      <MapPin size={12} /> {zone.city?.name}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${zone.isActive ? "bg-green-50 text-green-600 border border-green-100" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    {zone.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {zone.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-5 min-h-[40px] leading-relaxed">{zone.description}</p>
                )}

                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 border border-gray-100/50">
                    <Building2 size={13} className="text-gray-400" />
                    <span>{zone._count?.storeZones ?? 0} <span className="text-gray-400 font-normal">stores</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 border border-gray-100/50">
                    <Users size={13} className="text-gray-400" />
                    <span>{zone._count?.driverZones ?? 0} <span className="text-gray-400 font-normal">drivers</span></span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${zone.boundary ? "bg-brand/5 text-brand border-brand/10" : "bg-red-50 text-red-500 border-red-100"}`}>
                    <MapPin size={13} />
                    <span>{zone.boundary ? "Boundary set" : "No polygon"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <button
                      className={`p-2 rounded-lg transition-colors ${zone.isActive ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                      onClick={() => handleToggleActive(zone)}
                      disabled={togglingId === zone.id}
                      title={zone.isActive ? "Deactivate" : "Activate"}
                    >
                      {togglingId === zone.id ? <Loader2 size={16} className="animate-spin" /> : zone.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    <button
                      className="p-2 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-lg transition-colors"
                      onClick={() => navigate(`/zones/${zone.id}/edit`)}
                      title="Edit zone"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => setDeleteConfirm(zone.id)}
                      title="Delete zone"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    className="flex items-center gap-1 text-[13px] font-bold text-gray-900 hover:text-brand transition-colors"
                    onClick={() => navigate(`/zones/${zone.id}/edit`)}
                  >
                    Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Delete confirm overlay */}
              {deleteConfirm === zone.id && (
                <div className="absolute inset-0 z-10 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <Trash2 size={24} />
                  </div>
                  <h4 className="text-white font-bold mb-1">Delete Zone?</h4>
                  <p className="text-gray-400 text-xs mb-6">This action cannot be undone. All store/driver links will be lost.</p>
                  <div className="flex items-center gap-3 w-full">
                    <button 
                      className="flex-1 px-4 py-2 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
                      onClick={() => handleDelete(zone.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ZonesPage;
