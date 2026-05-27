import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  User, Phone, ShieldCheck, Lock, Upload, Camera, Loader2, RefreshCw 
} from 'lucide-react';

export const UserSettings: React.FC = () => {
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
    <div className="space-y-8 font-sans max-w-4xl mx-auto pb-12 animate-in fade-in duration-200" id="user-settings-view">
      {/* Header title */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Account & Security Settings</h1>
        <p className="text-slate-500 text-xs mt-1">
          Synchronize contact information, list profile icons, or rotate credential keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card avatar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs flex flex-col items-center justify-between text-center max-h-[360px]">
          <div className="space-y-4">
            <span className="text-[10px] bg-slate-50 text-slate-500 font-mono font-bold tracking-wider rounded px-2.5 py-1 inline-block uppercase">
              Current Identity
            </span>
            
            {/* Avatar block with upload trigger overlay */}
            <div 
              className={`relative group w-24 h-24 rounded-full border-2 overflow-hidden bg-slate-50 flex items-center justify-center transition cursor-pointer ${
                dragOver ? 'border-blue-500 scale-102 ring-4 ring-blue-50' : 'border-slate-200'
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
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-black font-mono text-slate-400">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </span>
              )}

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-bold">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-1" />
                    <span>Change Cover</span>
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
              <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{fullName || 'My Profile'}</h3>
              <p className="text-slate-400 text-[10px] font-mono mt-1 capitalize tracking-wider font-semibold">
                {profile?.role || 'client'} role
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-snug">
            Drag image file onto user circle image, or click to upload JPEG/PNG/WebP format.
          </p>
        </div>

        {/* Right Columns: Detail forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Profile form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Basic Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="My full legal name"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                      required
                    />
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Contact Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +233 XX XXX XXX"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                    />
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile || uploading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-500/15 disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Save Profile Setting
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Password change form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150/80 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-50 pb-3 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" /> Alter Security Password
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Current Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (UX sanity check)"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                  />
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                    />
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Verify spelling"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition"
                    />
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing credentials...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Submit Security Update
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
};
