import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  User, Phone, ShieldCheck, Lock, Camera, Loader2, RefreshCw, Layers 
} from 'lucide-react';

export const UserSettings = () => { 
  const { user, profile, refreshProfile } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Sync state initially with loaded profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Handle Drag & Drop utilities for usability
  const [dragOver, setDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAvatarUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAvatarUpload(e.target.files[0]);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded! Click Save Profile to apply changes.');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error(err.message || 'Failed to upload image to metadata buckets.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!fullName.trim()) {
      toast.error('Full Name is required');
      return;
    }

    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile settings synchronized successfully.');
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Failed to update database metadata profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Security password altered successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      toast.error(err.message || 'Failed to update credentials.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-slate-900 font-sans antialiased animate-in fade-in duration-300" id="user-settings-view">
      
      {/* ================= MINIMALIST HEADER BAR ================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200/80 pb-8 mb-12 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 block mb-1">
            System Console
          </span>
          <h1 className="text-3xl font-serif font-light tracking-tight text-slate-950">
            Account Security & Identity
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-normal leading-relaxed max-w-xl">
            Synchronize contact metadata node sets, upload cryptographic verification identities, or rotate platform infrastructure credentials cleanly.
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 self-start md:self-auto">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>RLS_ISOLATION_STATUS // ENFORCED</span>
        </div>
      </div>

      {/* ================= UNIFIED GRID OVERHAUL (NO SEPARATE CARDS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COMPACT MANAGEMENT INTERFACE (3/12 Width) */}
        <div className="lg:col-span-4 space-y-8 lg:border-r lg:border-slate-200/60 lg:pr-12">
          
          <div className="space-y-4">
            <span className="text-[10px] bg-slate-950 text-white font-mono font-bold tracking-widest rounded px-2.5 py-1 inline-block uppercase">
              Current Identity
            </span>
            
            {/* Minimalist interactive dropzone */}
            <div 
              className={`relative group w-28 h-28 rounded-xl border border-dashed overflow-hidden bg-slate-50 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                dragOver ? 'border-blue-500 bg-blue-50/40 ring-4 ring-blue-50/50' : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={fullName} 
                  className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition duration-300" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-3xl font-light font-serif text-slate-400">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}

              {/* Ultra-clean hover status matrix */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold tracking-wider uppercase">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <>
                    <Camera className="w-4 h-4 mb-1" />
                    <span>Upload Logo</span>
                  </>
                )}
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />

            <div>
              <h3 className="text-lg font-serif font-normal text-slate-950 leading-tight">{fullName || 'Unassigned User'}</h3>
              <p className="text-slate-400 text-[10px] font-mono mt-1 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {profile?.role || 'client'} authority
              </p>
            </div>
          </div>

          <hr className="border-slate-200/60" />

          <p className="text-[11px] text-slate-500 leading-relaxed font-light">
            💡 <strong className="font-semibold text-slate-700">Interface Tip:</strong> Drag your structural profile image directly over the frame asset wrapper box, or select a source file path natively.
          </p>
        </div>

        {/* RIGHT DATA ENTRY INTERFACE FIELDS (8/12 Width) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* CORE IDENTITY SCHEMA METADATA */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" /> 
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Basic System Information</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Legal Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Kwame Mensah"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-slate-950 focus:ring-4 focus:ring-slate-100 transition-all"
                      required
                    />
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone Sequence</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +233 XX XXX XXX"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-slate-950 focus:ring-4 focus:ring-slate-100 transition-all"
                    />
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile || uploading}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-slate-950/10 disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synchronizing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Save Profile Matrix
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* CREDENTIAL KEYS KEYSPACE ROTATION */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-6 border-b border-slate-100">
              <Lock className="w-4 h-4 text-slate-800" /> 
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900">Credential Key Rotation</h2>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Current Token Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-slate-950 focus:ring-4 focus:ring-slate-100 transition-all"
                  />
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">New Cryptographic Passphrase</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 standard codes"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-slate-950 focus:ring-4 focus:ring-slate-100 transition-all"
                    />
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Confirm Passphrase Configuration</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Verify character symmetry"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-slate-950 focus:ring-4 focus:ring-slate-100 transition-all"
                    />
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-slate-950/10 disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Committing cipher keys...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Deploy New Passphrase
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}