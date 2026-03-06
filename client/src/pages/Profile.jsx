import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User, Mail, Calendar, Edit2, Save, Camera, Lock,
  ChevronRight, DollarSign, Clock, Award, Zap, Globe,
  Bell, CreditCard, Ticket, X, Plus, Check, ArrowLeft,
  Shield, TrendingUp, ExternalLink, Star,
} from "lucide-react";
import axios from "../utils/axios";
import toast from "react-hot-toast";
import LanguagePreferences from "../components/LanguagePreferences";
import { Link, useNavigate } from "react-router-dom";

/* ─── Reusable primitives ─── */

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-gray-400" />}
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h2>
    </div>
    {action}
  </div>
);

const TextBtn = ({ onClick, children }) => (
  <button onClick={onClick} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
    {children}
  </button>
);

const InputField = ({ label, name, value, onChange, type = "text", error, hint, rows }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
    {rows ? (
      <textarea
        name={name} value={value} onChange={onChange} rows={rows}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 focus:bg-white outline-none transition-all focus:ring-2 focus:ring-indigo-200 resize-none ${error ? "border-red-300" : "border-gray-200 focus:border-indigo-300"}`}
      />
    ) : (
      <input
        type={type} name={name} value={value} onChange={onChange}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50 focus:bg-white outline-none transition-all focus:ring-2 focus:ring-indigo-200 ${error ? "border-red-300" : "border-gray-200 focus:border-indigo-300"}`}
      />
    )}
    {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-indigo-500" : "bg-gray-200"}`}
  >
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-1"}`} />
  </button>
);

const Badge = ({ children, color = "gray" }) => {
  const map = {
    gray:   "bg-gray-100 text-gray-600",
    indigo: "bg-indigo-50 text-indigo-600",
    green:  "bg-emerald-50 text-emerald-600",
    amber:  "bg-amber-50 text-amber-600",
    red:    "bg-red-50 text-red-500",
    purple: "bg-purple-50 text-purple-600",
    blue:   "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const StatTile = ({ label, value, color }) => {
  const map = {
    indigo: "bg-indigo-50 text-indigo-600",
    green:  "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    blue:   "bg-blue-50 text-blue-600",
    amber:  "bg-amber-50 text-amber-600",
  };
  return (
    <div className={`rounded-xl p-4 ${map[color] || map.indigo}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-60 font-medium">{label}</p>
    </div>
  );
};

const Modal = ({ onClose, title, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <X size={15} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  </div>
);

/* ─── Main component ─── */

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing]                     = useState(false);
  const [isChangingPassword, setIsChangingPassword]   = useState(false);
  const [showLanguagePrefs, setShowLanguagePrefs]     = useState(false);
  const [showInterestsModal, setShowInterestsModal]   = useState(false);
  const [showNotifModal, setShowNotifModal]           = useState(false);
  const [loading, setLoading]                         = useState(false);

  const [formData, setFormData] = useState({ fullName: "", username: "", bio: "", creatorBio: "" });
  const [pwData, setPwData]     = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors]     = useState({});
  const [interestInput, setInterestInput] = useState("");
  const [tempInterests, setTempInterests] = useState([]);
  const [notifPrefs, setNotifPrefs]       = useState({
    newFollowers: true, roomReminders: true, friendActivity: true, recommendations: true,
  });

  useEffect(() => {
    if (!user) return;
    setFormData({ fullName: user.fullName || "", username: user.username || "", bio: user.bio || "", creatorBio: user.creatorBio || "" });
    setTempInterests(user.interests || []);
    setNotifPrefs({
      newFollowers:    user.notificationPreferences?.newFollowers    ?? true,
      roomReminders:   user.notificationPreferences?.roomReminders   ?? true,
      friendActivity:  user.notificationPreferences?.friendActivity  ?? true,
      recommendations: user.notificationPreferences?.recommendations ?? true,
    });
  }, [user]);

  const fetchUserProfile = async () => {
    try { const { data } = await axios.get("/profile/me"); setUser(data.user); } catch {}
  };

  const validateProfile = () => {
    const e = {};
    if (formData.username.length < 3)   e.username = "Min 3 characters";
    if (formData.username.length > 20)  e.username = "Max 20 characters";
    if ((formData.bio?.length || 0) > 200)        e.bio = "Max 200 characters";
    if ((formData.creatorBio?.length || 0) > 500) e.creatorBio = "Max 500 characters";
    return e;
  };

  const validatePassword = () => {
    const e = {};
    if (!pwData.currentPassword)       e.currentPassword = "Required";
    if (pwData.newPassword.length < 6) e.newPassword = "Min 6 characters";
    if (pwData.newPassword !== pwData.confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  };

  const handleUpdateProfile = async (ev) => {
    ev.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { data } = await axios.put("/profile/me", formData);
      setUser(data.user); toast.success("Profile saved"); setIsEditing(false); setErrors({});
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (ev) => {
    ev.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await axios.put("/profile/change-password", { currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
      toast.success("Password updated");
      setIsChangingPassword(false); setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" }); setErrors({});
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const handleUpdateInterests = async () => {
    try {
      const { data } = await axios.put("/profile/interests", { interests: tempInterests });
      setUser(data.user); toast.success("Interests saved"); setShowInterestsModal(false);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleUpdateNotifications = async () => {
    try {
      const { data } = await axios.put("/profile/notifications", { preferences: notifPrefs });
      setUser(data.user); toast.success("Preferences saved"); setShowNotifModal(false);
    } catch { toast.error("Failed"); }
  };

  const addInterest = () => {
    const v = interestInput.trim();
    if (v && !tempInterests.includes(v)) { setTempInterests([...tempInterests, v]); setInterestInput(""); }
  };

  /* derived */
  const xpInLevel   = (user?.xp || 0) % 100;
  const xpPct       = Math.min((xpInLevel / 100) * 100, 100);
  const roleBadge   = user?.role === "admin" ? "purple" : user?.role === "moderator" ? "blue" : "green";
  const initial     = (user?.fullName || user?.username || "?").charAt(0).toUpperCase();
  const notifItems  = [
    { key: "newFollowers",    label: "New Followers" },
    { key: "roomReminders",   label: "Room Reminders" },
    { key: "friendActivity",  label: "Friend Activity" },
    { key: "recommendations", label: "Recommendations" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <span className="text-sm font-semibold text-gray-900">Profile</span>
          <div className="w-14" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* ── Hero ── */}
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-400" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl ring-4 ring-white shadow-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : initial}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Camera size={12} className="text-gray-500" />
                </button>
              </div>
              <button
                onClick={() => { setIsEditing(!isEditing); setErrors({}); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${isEditing ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-700"}`}
              >
                <Edit2 size={12} />{isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {!isEditing ? (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{user?.fullName}</h1>
                  {user?.isCreator && <Badge color="amber">✦ Creator</Badge>}
                  <Badge color={roleBadge}>{user?.role}</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">@{user?.username}</p>
                {user?.bio && <p className="text-sm text-gray-600 leading-relaxed mb-3">{user.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Mail size={11} />{user?.email}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} />Joined {new Date(user?.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                  <InputField label="Username" name="username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} error={errors.username} />
                </div>
                <InputField label="Bio" name="bio" value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows={2} error={errors.bio} hint={`${formData.bio.length}/200`} />
                {user?.isCreator && (
                  <InputField label="Creator Bio" name="creatorBio" value={formData.creatorBio} onChange={e => setFormData({ ...formData, creatorBio: e.target.value })} rows={3} error={errors.creatorBio} hint={`${formData.creatorBio.length}/500`} />
                )}
                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
                    <Save size={12} />{loading ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Card>

        {/* ── Stats ── */}
        <Card className="p-6">
          <SectionTitle icon={Zap} title="Your Stats" />
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-gray-800">Level {user?.level || 1}</span>
            <span className="text-gray-400">{xpInLevel} / 100 XP</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <StatTile label="Level"   value={user?.level || 1}             color="indigo" />
            <StatTile label="XP"      value={user?.xp || 0}                color="purple" />
            <StatTile label="Hosted"  value={user?.totalRoomsHosted || 0}  color="blue" />
            <StatTile label="Joined"  value={user?.totalRoomsJoined || 0}  color="green" />
          </div>
          {user?.badges?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Award size={11} /> Badges
              </p>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((b, i) => (
                  <div key={i} title={b.description} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 cursor-default transition-colors">
                    <span>{b.icon}</span>{b.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ── Interests ── */}
        <Card className="p-6">
          <SectionTitle icon={Star} title="Interests" action={<TextBtn onClick={() => setShowInterestsModal(true)}>Edit</TextBtn>} />
          {user?.interests?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((t, i) => <Badge key={i} color="indigo">{t}</Badge>)}
            </div>
          ) : (
            <button onClick={() => setShowInterestsModal(true)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors">
              <Plus size={14} /> Add interests
            </button>
          )}
        </Card>

        {/* ── Language Learning ── */}
        <Card className="p-6">
          <SectionTitle icon={Globe} title="Language Learning" action={<TextBtn onClick={() => setShowLanguagePrefs(true)}>Edit</TextBtn>} />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Native language</span>
              <span className="text-sm font-medium text-gray-800">{user?.nativeLanguage || <span className="text-gray-400">Not set</span>}</span>
            </div>
            {user?.learningLanguages?.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {user.learningLanguages.map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl">
                    {l.language} <span className="opacity-50">·</span> {l.level}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No languages added yet</p>}
            <Link to="/rooms?type=language" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors pt-1">
              Find language rooms <ChevronRight size={12} />
            </Link>
          </div>
        </Card>

        {/* ── Notifications ── */}
        <Card className="p-6">
          <SectionTitle icon={Bell} title="Notifications" action={<TextBtn onClick={() => setShowNotifModal(true)}>Edit</TextBtn>} />
          <div className="space-y-2.5">
            {notifItems.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-xs font-medium ${user?.notificationPreferences?.[key] ? "text-emerald-600" : "text-gray-400"}`}>
                  {user?.notificationPreferences?.[key] ? "On" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Security ── */}
        <Card className="p-6">
          <SectionTitle icon={Lock} title="Security" />
          {!isChangingPassword ? (
            <button onClick={() => { setIsChangingPassword(true); setErrors({}); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors">
              <Lock size={14} /> Change Password
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <InputField label="Current Password" name="currentPassword" type="password" value={pwData.currentPassword} onChange={e => setPwData({ ...pwData, currentPassword: e.target.value })} error={errors.currentPassword} />
              <InputField label="New Password"     name="newPassword"     type="password" value={pwData.newPassword}     onChange={e => setPwData({ ...pwData, newPassword: e.target.value })}     error={errors.newPassword} />
              <InputField label="Confirm Password" name="confirmPassword" type="password" value={pwData.confirmPassword} onChange={e => setPwData({ ...pwData, confirmPassword: e.target.value })} error={errors.confirmPassword} />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setIsChangingPassword(false); setErrors({}); setPwData({ currentPassword:"", newPassword:"", confirmPassword:"" }); }}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  <Check size={12} />{loading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </Card>

        {/* ── Creator Earnings ── */}
        {user?.isCreator && (
          <Card className="p-6">
            <SectionTitle icon={DollarSign} title="Creator Earnings" action={
              <Link to="/creator/dashboard" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Dashboard <ExternalLink size={11} />
              </Link>
            } />
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatTile label="Available" value={`$${(user?.availableBalance || 0).toFixed(2)}`} color="green" />
              <StatTile label="Pending"   value={`$${(user?.pendingBalance   || 0).toFixed(2)}`} color="amber" />
              <StatTile label="Lifetime"  value={`$${(user?.lifetimeEarnings || 0).toFixed(2)}`} color="purple" />
            </div>
            <div className="pt-4 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CreditCard size={11} /> Payout Method
              </p>
              {user?.stripeAccountId ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stripe</span>
                  <Badge color={user.stripeAccountStatus === "active" ? "green" : user.stripeAccountStatus === "pending" ? "amber" : "red"}>
                    {user.stripeAccountStatus}
                  </Badge>
                </div>
              ) : (
                <button className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">Connect Stripe →</button>
              )}
            </div>
            {user?.payouts?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50 space-y-2.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent Payouts</p>
                {user.payouts.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{new Date(p.requestedAt).toLocaleDateString()}</span>
                    <span className="font-medium">${p.amount}</span>
                    <Badge color={p.status === "processed" ? "green" : p.status === "pending" ? "amber" : "red"}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Tickets ── */}
        {user?.tickets?.length > 0 && (
          <Card className="p-6">
            <SectionTitle icon={Ticket} title="My Tickets" />
            <div className="space-y-2">
              {user.tickets.slice(0, 3).map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Room #{t.room}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(t.purchasedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">${t.amount}</span>
                </div>
              ))}
              {user.tickets.length > 3 && (
                <Link to="/my-tickets" className="block text-center text-xs text-indigo-600 hover:text-indigo-800 pt-1 transition-colors">
                  View all {user.tickets.length} tickets →
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* ── Become Creator ── */}
        {!user?.isCreator && user?.creatorApplication?.status !== "pending" && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 border border-indigo-100">
                <TrendingUp size={18} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Become a Creator</h3>
                <p className="text-sm text-gray-600 mb-4">Monetize your rooms and grow your audience.</p>
                <Link to="/creator/apply" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                  <DollarSign size={12} /> Apply Now
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* ── Pending ── */}
        {user?.creatorApplication?.status === "pending" && (
          <Card className="p-5 bg-amber-50 border-amber-100">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Application Under Review</p>
                <p className="text-xs text-amber-600 mt-0.5">We'll notify you once it's approved.</p>
              </div>
            </div>
          </Card>
        )}

      </main>

      {/* ── Modals ── */}

      {showInterestsModal && (
        <Modal
          title="Edit Interests"
          onClose={() => setShowInterestsModal(false)}
          footer={
            <>
              <button onClick={() => setShowInterestsModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleUpdateInterests} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 transition-colors">Save</button>
            </>
          }
        >
          <div className="flex gap-2 mb-4">
            <input
              value={interestInput} onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addInterest())}
              placeholder="Add an interest…"
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
            <button onClick={addInterest} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
              <Plus size={15} />
            </button>
          </div>
          <div className="min-h-24 flex flex-wrap gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50">
            {tempInterests.length === 0
              ? <p className="text-sm text-gray-400 m-auto">No interests added</p>
              : tempInterests.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                  {t}
                  <button onClick={() => setTempInterests(tempInterests.filter(i => i !== t))} className="hover:text-indigo-900 ml-0.5">
                    <X size={11} />
                  </button>
                </span>
              ))
            }
          </div>
        </Modal>
      )}

      {showNotifModal && (
        <Modal
          title="Notification Preferences"
          onClose={() => setShowNotifModal(false)}
          footer={
            <>
              <button onClick={() => setShowNotifModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleUpdateNotifications} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 transition-colors">Save</button>
            </>
          }
        >
          <div className="space-y-5">
            {notifItems.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                </div>
                <Toggle checked={notifPrefs[key]} onChange={val => setNotifPrefs({ ...notifPrefs, [key]: val })} />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showLanguagePrefs && (
        <LanguagePreferences onClose={() => setShowLanguagePrefs(false)} onUpdate={fetchUserProfile} />
      )}
    </div>
  );
};

export default Profile;