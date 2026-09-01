import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Archive, Eye, RefreshCw, Building, Home
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatPriceCompact } from '../shared/utils/format';
import { LoadingSpinner, EmptyState, ErrorState } from '../shared/components/FeedbackStates';
import { getErrorMessage } from '../shared/utils/error';
import { useAuth } from '../hooks/useAuth';
import { propertyQueryKeys, useAgentPropertiesQuery, useArchivePropertyMutation } from '../features/properties/hooks/usePropertyQueries';

export const AgentPropertiesList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Confirmation dialog overlay state
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);

  // Fetch Agent listings
  const { data: properties = [], isLoading, isError, error, refetch } = useAgentPropertiesQuery(userId);

  const archiveMutation = useArchivePropertyMutation();

  const handleArchiveConfirm = () => {
    if (archiveTargetId) {
      archiveMutation.mutate(archiveTargetId, {
        onSuccess: () => {
          toast.success('Property listing has been archived successfully.');
          queryClient.invalidateQueries({ queryKey: propertyQueryKeys.agentList(userId) });
          setArchiveTargetId(null);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, 'Error occurred while archiving the listing.'));
          setArchiveTargetId(null);
        }
      });
    }
  };

  // Filter listings based on Agent choices
  const filteredList = properties.filter((prop) => {
    const matchesSearch = prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prop.location_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prop.location_area.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prop.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Status badge style helper
  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rented':
        return 'bg-amber-50 text-amber-750 border-amber-200';
      case 'sold':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'archived':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-slate-100 text-slate-650 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
            My Property Listings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain, edit or status archive your published portfolio.
          </p>
        </div>
        <Link
          to="/dashboard/properties/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow shadow-blue-500/20 cursor-pointer self-start sm:self-auto uppercase tracking-wide"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      {/* Filters & Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by listing title, city, neighborhood..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-sans pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status dropdown filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto py-2 pl-3 pr-8 border border-slate-200 rounded-xl font-sans text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">Any Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 transition whitespace-nowrap"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4 animate-hover" />
          </button>
        </div>
      </div>

      {/* Table & Empty States */}
      {isLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl">
          <LoadingSpinner message="Compiling property table rows..." />
        </div>
      ) : isError ? (
        <ErrorState
          title="Error reading properties"
          description={getErrorMessage(error, 'Could not authenticate metadata or load properties rows.')}
          onRetry={() => refetch()}
        />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={<Building className="w-8 h-8" />}
          title="No properties align here"
          description="You have not configured any property matching these search options. Create a new listing row today."
          actionLabel="Create Property Listing"
          onAction={() => navigate('/dashboard/properties/new')}
        />
      ) : (
        /* Responsive Desktop Table / Mobile Cards */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-650 text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 font-mono font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-5">Property Specs</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Deal</th>
                  <th className="py-3 px-4">Valuation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredList.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition">
                    {/* Title & Image thumbnail snippet */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3 max-w-[280px]">
                        {prop.image_urls && prop.image_urls.length > 0 && prop.image_urls[0] ? (
                          <img
                            src={prop.image_urls[0]}
                            alt=""
                            className="w-10 h-8 rounded object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                            <Home className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-extrabold text-slate-900 truncate leading-tight hover:text-blue-600 transition">
                            <Link to={`/properties/${prop.id}`}>{prop.title}</Link>
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize inline-block mt-0.5">
                            {prop.location_area}, {prop.location_city}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Property type */}
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                      {prop.property_type}
                    </td>

                    {/* Listing Deal Type */}
                    <td className="py-3.5 px-4 capitalize font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${prop.listing_type === 'sale' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {prop.listing_type}
                      </span>
                    </td>

                    {/* Valuation Price */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {formatPriceCompact(prop.price)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded border ${getStatusBadge(prop.status)}`}>
                        {prop.status}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-450">
                      {new Date(prop.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions Panel */}
                    <td className="py-3.5 px-5 text-right font-semibold">
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <Link
                          to={`/properties/${prop.id}`}
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition"
                          title="View Public Link"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        
                        <button
                          onClick={() => navigate(`/dashboard/properties/${prop.id}/edit`)}
                          className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-50 transition cursor-pointer"
                          title="Edit Listing details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {prop.status !== 'archived' && (
                          <button
                            onClick={() => setArchiveTargetId(prop.id)}
                            className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition cursor-pointer"
                            title="Archive Listing"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION OVERLAY MODAL */}
      {archiveTargetId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 max-w-sm w-full rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-black text-slate-900 tracking-tight font-sans">Archive Listing?</h4>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Are you certain about archiving this real estate property listing? It will no longer serve under public search indexes.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setArchiveTargetId(null)}
                className="px-3.5 py-2 hover:bg-slate-150 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                disabled={archiveMutation.isPending}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow shadow-red-500/10 cursor-pointer flex items-center gap-1"
              >
                {archiveMutation.isPending ? 'Archiving...' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
