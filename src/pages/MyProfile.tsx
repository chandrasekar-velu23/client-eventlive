import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile, getUserActivityLogs, uploadAvatar } from "../services/api";
import { toast } from "sonner";
import {
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CameraIcon
} from "@heroicons/react/24/outline";

interface ActivityLog {
  _id: string;
  action: string;
  details: any;
  createdAt: string;
}

export default function MyProfile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: "",
    organizationName: "",
    eventTypes: [] as string[],
    socialLinks: {
      twitter: "",
      linkedin: "",
      facebook: "",
      instagram: "",
      website: "",
    },
  });

  const EVENT_TYPE_OPTIONS = ["Webinar", "Conference", "Workshop", "Meetup", "Concert", "Other"];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        organizationName: user.organizationName || "",
        eventTypes: user.eventTypes || [],
        socialLinks: {
          twitter: user.socialLinks?.twitter || "",
          linkedin: user.socialLinks?.linkedin || "",
          facebook: user.socialLinks?.facebook || "",
          instagram: user.socialLinks?.instagram || "",
          website: user.socialLinks?.website || "",
        },
      });
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      const data = await getUserActivityLogs();
      setLogs(data as any);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading avatar...");
    try {
      const { url } = await uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar: url }));
      toast.success("Avatar uploaded successfully", { id: toastId });
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload avatar. Ensure it is an image < 5MB.", { id: toastId });
    }
  };

  const toggleEventType = (type: string) => {
    setFormData(prev => {
      const current = prev.eventTypes || [];
      if (current.includes(type)) {
        return { ...prev, eventTypes: current.filter(t => t !== type) };
      } else {
        return { ...prev, eventTypes: [...current, type] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedProfile = await updateUserProfile(formData);

      // Update local auth state
      if (user) {
        login({ ...user, ...updatedProfile });
      }

      toast.success("Profile updated successfully");
      fetchLogs(); // Refresh logs
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">

      {/* Header */}
      <header className="flex items-center gap-4 border-b border-brand-accent/20 pb-6">
        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-brand-primary shadow-lg">
          {formData.avatar ? (
            <img src={formData.avatar} alt={formData.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-brand-surface flex items-center justify-center text-brand-primary font-bold text-2xl">
              {formData.name.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{user?.name}</h1>
          <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wide">
            {user?.role}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-brand-accent/10 p-6 space-y-6">
            <div className="flex items-center gap-2 text-brand-primary font-bold border-b border-brand-accent/10 pb-2">
              <UserIcon className="h-5 w-5" />
              <h2>Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-brand-accent/30 px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-dark mb-1">Email <span className="text-xs font-normal text-brand-muted">(Read-only)</span></label>
                <div className="relative">
                  <input
                    value={user?.email}
                    disabled
                    className="w-full rounded-lg border border-brand-accent/20 bg-gray-50 px-3 py-2 pl-9 outline-none text-gray-500 cursor-not-allowed"
                  />
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">Profile Picture</label>
              <div className="flex gap-2">
                <input
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-brand-accent/30 px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
                <label className="cursor-pointer bg-brand-surface border border-brand-accent/30 text-brand-dark hover:bg-brand-accent/10 px-3 py-2 rounded-lg flex items-center justify-center transition-colors" title="Upload Image">
                  <CameraIcon className="h-5 w-5 text-brand-muted" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              <p className="text-xs text-brand-muted mt-1">Enter URL or click camera to upload (Max 5MB).</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-brand-dark mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-brand-accent/30 px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            {/* Organizer Specific Section */}
            {
              user?.role === 'Organizer' && (
                <>
                  <div className="flex items-center gap-2 text-brand-primary font-bold border-b border-brand-accent/10 pb-2 pt-4">
                    <BuildingOfficeIcon className="h-5 w-5" />
                    <h2>Organization Profile</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-1">Organization Name</label>
                    <input
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      placeholder="e.g. Tech Events Inc."
                      className="w-full rounded-lg border border-brand-accent/30 px-3 py-2 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-brand-dark mb-2">Event Types of Interest</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {EVENT_TYPE_OPTIONS.map(type => (
                        <label key={type} className={`cursor-pointer border rounded-lg p-2 text-sm flex items-center gap-2 transition-colors ${formData.eventTypes?.includes(type) ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-bold' : 'hover:bg-gray-50 border-brand-accent/20'}`}>
                          <input
                            type="checkbox"
                            checked={formData.eventTypes?.includes(type) || false}
                            onChange={() => toggleEventType(type)}
                            className="rounded text-brand-primary focus:ring-brand-primary"
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )
            }

            <div className="flex items-center gap-2 text-brand-primary font-bold border-b border-brand-accent/10 pb-2 pt-4">
              <BriefcaseIcon className="h-5 w-5" />
              <h2>Social Links</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['website', 'twitter', 'linkedin', 'facebook', 'instagram'].map(platform => (
                <div key={platform}>
                  <label className="block text-xs font-bold text-brand-muted uppercase mb-1">{platform}</label>
                  <input
                    name={platform}
                    value={(formData.socialLinks as any)[platform]}
                    onChange={handleSocialChange}
                    placeholder={`Your ${platform} URL`}
                    className="w-full rounded-lg border border-brand-accent/30 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-primary text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form >
        </div >

        {/* Sidebar / Logs */}
        < div className="space-y-6" >
          <div className="bg-white rounded-xl shadow-sm border border-brand-accent/10 p-6">
            <div className="flex items-center gap-2 text-brand-dark font-bold mb-4">
              <ShieldCheckIcon className="h-5 w-5 text-brand-primary" />
              <h2>Account Status</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Role</span>
                <span className="font-medium">{user?.role}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Verification</span>
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <ShieldCheckIcon className="h-4 w-4" /> Verified
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-brand-accent/10 p-6">
            <div className="flex items-center gap-2 text-brand-dark font-bold mb-4">
              <ClockIcon className="h-5 w-5 text-brand-primary" />
              <h2>Recent Activity</h2>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity.</p>
              ) : (
                logs.map(log => (
                  <div key={log._id} className="text-sm border-l-2 border-brand-accent pl-3 py-1 relative">
                    <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-brand-primary" />
                    <p className="font-medium text-brand-dark">{log.action}</p>
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                    {log.details && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div >

      </div >
    </div >
  );
}
