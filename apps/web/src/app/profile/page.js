"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Camera,
  LogOut,
  FolderOpen,
  Code,
  Activity,
  Bell,
  Settings,
  ChevronRight,
  User2,
  Zap,
  Box,
  Bot,
  Eye,
  LineChart,
  LogOutIcon,
  PowerOffIcon,
  EyeOff,
  Copy,
  Terminal,
  Key,
  LifeBuoy,
  FileText,
  Shield,
  Cookie,
} from "lucide-react";
import { Button, Chip, InputField, Toast } from "@/components/Elements";
import { GradientSpot } from "@/components/Common";
import ProductCard from "@/components/Product/Card";
import dynamic from "next/dynamic";
import { useUser, withAuth } from "@/auth/UseUser";
import { useRouter, useSearchParams } from "next/navigation";
import {
  changePassword,
  getUserSubscriptionUsage,
  generateCliToken,
  getCliToken,
  revokeCliToken,
  updateUserInfo,
  deleteUser,
  logoutUser,
} from "@/lib/api";
import PaymentPlans from "@/components/Payment/PaymentPlans";
import ConfirmationModal from "@/components/Common/ConfirmationModal";

const UserProfilePage = () => {
  const { user, setUser } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  //get query menagement true or false
  const query = useSearchParams();
  const isQueryManagement = query.get("plans") === "true";

  useEffect(() => {
    if (user && user.firstName) {
      setUserName(user.firstName);
    }
    if (isQueryManagement) {
      setActiveTab("manage-plans");
    }
  }, [user]);

  const handleSave = () => {
    setIsEditing(false);
    setIsToastVisible(true);
  };

  const navItems = [
    {
      id: "profile",
      icon: User,
      label: "Profile",
      desc: "Plan & usage details",
    },
    // { id: 'notifications', icon: Bell, label: 'Notifications' },
    {
      id: "terms-support",
      icon: LifeBuoy,
      label: "Terms & Support",
      desc: "Help & legal info",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      desc: "Security settings",
    },
    { id: "logout", icon: PowerOffIcon, label: "Logout", desc: "End session" },
  ];
  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
    setUser({});
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileContent
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSave={handleSave}
            setActiveTab={setActiveTab}
          />
        );
      case "notifications":
        return <NotificationsContent />;
      case "manage-plans":
        return <ManagePaymentPlans />;
      case "terms-support":
        return <TermsSupportContent />;
      case "settings":
        return <SettingsContent />;
      case "logout":
        handleLogout();
      default:
        return null;
    }
  };

  return (
    <div
      className="flex items-start justify-start px-4 mx-auto w-full max-w-7xl"
      style={{ height: "calc(100vh - 72px)" }}
    >
      {/* <div className="hidden md:block">
                <GradientSpot color="oklch(56.37% 0.1918 316.31 / 50%)" size={600} position={{ x: '-10%', y: '-10%' }} opacity={0.05} />
            </div>
            <div className="block md:hidden">
                <GradientSpot color="oklch(56.37% 0.1918 316.31 / 50%)" size={300} position={{ x: '-10%', y: '-10%' }} opacity={0.05} />
            </div> */}
      <div className="relative h-full transition-all duration-300 ease-in-out flex items-start justify-start lg:w-64 w-14">
        <div className="py-8 flex flex-col items-start">
          <div className="sm:ml-2 ml-1 flex items-center gap-4 mb-8">
            <div className="flex items-center justify-center rounded-2xl min-w-10 min-h-10 bg-[#191919] border border-white/10">
              <User2 className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-left hidden lg:block">
              {userName}
            </h1>
          </div>
          <div className="flex flex-col sm:gap-0 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-3 justify-start w-full sm:p-2 p-1 lg:min-w-48 mb-2 rounded-3xl transition-colors hover:bg-white/10 `}
                onClick={() => setActiveTab(item.id)}
              >
                <div
                  className={`border p-[9px] rounded-2xl border-white/15 ${
                    activeTab === item.id
                      ? "bg-[#191919] border-purple-800/90 text-white/60"
                      : "bg-[#191919] text-gray-500"
                  }`}
                >
                  <item.icon className="w-6 h-6 flex-shrink-0" />
                </div>
                <div className="hidden sm:flex flex-col justify-start items-start">
                  <span
                    className={`text-[16px] whitespace-nowrap hidden lg:inline ${
                      activeTab === item.id
                        ? "text-purple-500/70"
                        : "text-white/80"
                    }`}
                  >
                    {item.label}
                  </span>
                  {/* <span className={`text-[14px]  ${activeTab === item.id ? 'text-purple-500/60' : 'text-white/60'}`}>{item.desc}</span> */}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-3 py-8 overflow-y-scroll w-full sm:pl-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {isToastVisible && (
        <Toast
          message="Changes saved successfully!"
          duration={3000}
          type="success"
          onClose={() => setIsToastVisible(false)}
        />
      )}
    </div>
  );
};

const ManagePaymentPlans = () => {
  return (
    <div className=" w-full">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 text-transparent bg-clip-text">
        <span className="hidden md:block">Manage Payment Plans</span>
        <span className="block md:hidden">Manage Plans</span>
      </h2>
      <div className="w-full">
        <PaymentPlans />
      </div>
    </div>
  );
};

const ProfileContent = ({
  isEditing,
  setIsEditing,
  handleSave,
  setActiveTab,
}) => {
  const [userUsage, setUserUsage] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadUsage = async () => {
    setIsLoading(true);
    const resp = await getUserSubscriptionUsage();
    if (resp.status === 200) {
      setUserUsage(resp.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const subscriptionPlan = userUsage.subscription || {};
  const usage = userUsage.usage || {};

  const componentCredits = {
    total: subscriptionPlan.toCredits || 0,
    used: subscriptionPlan.toCredits - usage.availableCredits || 0,
    percentage: Math.min(
      100,
      Math.round(
        ((subscriptionPlan.toCredits - usage.availableCredits || 0) /
          (subscriptionPlan.toCredits || 1)) *
          100
      )
    ),
  };

  const aiCredits = {
    total: subscriptionPlan.toAiCredits || 0,
    used: subscriptionPlan.toAiCredits - usage.availableAiCredits || 0,
    percentage: Math.min(
      100,
      Math.round(
        ((subscriptionPlan.toAiCredits - usage.availableAiCredits || 0) /
          (subscriptionPlan.toAiCredits || 1)) *
          100
      )
    ),
  };

  return (
    <div className="mx-auto w-full">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 text-transparent bg-clip-text">
        My Profile
      </h2>
      <div className="flex flex-col gap-8 mb-8 w-full">
        <div className="w-full flex flex-col gap-6">
          {isLoading ? (
            <motion.div
              className="relative rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-[180px] flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <div className="animate-pulse flex flex-col gap-4">
                <div className="h-8 w-8 bg-white/10 rounded-lg" />
                <div className="h-6 w-48 bg-white/10 rounded-lg" />
                <div className="h-4 w-32 bg-white/10 rounded-lg" />
                <div className="mt-auto h-9 w-28 bg-white/10 rounded-lg" />
              </div>
            </motion.div>
          ) : (
            <SubscriptionCard
              title="Subscription Plan"
              description={subscriptionPlan.planName || "No active plan"}
              icon={<Zap className="w-8 h-8" />}
              colors={subscriptionPlan.colors || ["#3b82f6", "#1e40af"]}
              status={subscriptionPlan.status}
              price={subscriptionPlan.planPrice}
              endDate={subscriptionPlan.endDate}
              setActiveTab={setActiveTab}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UsageCard
              title="Component Credits"
              description={
                subscriptionPlan?.planPrice > 0
                  ? `${componentCredits.used} / ${componentCredits.total} used`
                  : `${usage.availableCredits} available`
              }
              icon={<Box className="w-8 h-8" />}
              colors={["#8d8d8d", "#ef4444"]}
              percentage={componentCredits.percentage}
              showProgress={subscriptionPlan?.planPrice > 0}
            />
            <UsageCard
              title="AI Credits"
              description={
                subscriptionPlan?.planPrice > 0
                  ? `${aiCredits.used} / ${aiCredits.total} used`
                  : `${usage.availableAiCredits} available`
              }
              icon={<Bot className="w-8 h-8" />}
              colors={["#ec4899", "#9d174d"]}
              percentage={aiCredits.percentage}
              showProgress={subscriptionPlan?.planPrice > 0}
            />
          </div>
        </div>
      </div>

      {/* <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Achievements</h3>
                <div className="flex flex-wrap gap-2">
                    <Chip label="React enjoyer" color="blue" />
                </div>
            </div> */}
    </div>
  );
};

const SubscriptionCard = ({
  title,
  description,
  icon,
  colors,
  status,
  price,
  setActiveTab,
  endDate,
}) => (
  <motion.div
    className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-full flex sm:flex-row flex-col justify-between sm:items-end items-start"
    style={{
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      WebkitMaskImage: "-webkit-radial-gradient(white, black)",
      isolation: "isolate",
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    whileHover={{
      opacity: 0.95,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
      transition: { duration: 0.3 },
    }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <motion.div
      className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
      style={{
        transformStyle: "preserve-3d",
      }}
    />
    <GradientSpot
      color={colors[0]}
      size={100}
      position={{ x: "0%", y: "-10%" }}
      opacity={0.2}
    />
    <GradientSpot
      color={colors[1]}
      size={180}
      position={{ x: "0%", y: "10%" }}
      opacity={0.2}
    />
    <div className="relative z-10">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>
      <div className="flex items-center gap-2">
        <p className="text-gray-400 mb-4">{description}</p>
        {status === "cancelled" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 px-3 py-1.5 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/15 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 animate-pulse" />
              <p className="text-red-400/80 text-sm font-medium">
                Active until{" "}
                {endDate
                  ? new Date(endDate).toLocaleDateString()
                  : "end of billing period"}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    <Button
      text={+price !== 0 ? "Manage Plan" : "Upgrade Plan"}
      variant="full"
      size="small"
      onClick={() => setActiveTab("manage-plans")}
    />
  </motion.div>
);

const UsageCard = ({
  title,
  description,
  icon,
  colors,
  percentage,
  showProgress,
}) => (
  <motion.div
    className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-full flex flex-col"
    style={{
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      WebkitMaskImage: "-webkit-radial-gradient(white, black)",
      isolation: "isolate",
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    whileHover={{
      opacity: 0.95,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
      transition: { duration: 0.3 },
    }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <motion.div
      className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
      style={{
        transformStyle: "preserve-3d",
      }}
    />
    <GradientSpot
      color={colors[0]}
      size={100}
      position={{ x: "0%", y: "-10%" }}
      opacity={0.2}
    />
    <GradientSpot
      color={colors[1]}
      size={180}
      position={{ x: "0%", y: "10%" }}
      opacity={0.2}
    />
    <div className="relative z-10">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>
      <p className="text-gray-400 mb-2">{description}</p>
      {showProgress && (
        <>
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-gray-400 mt-1">
            {percentage}% used
          </p>
        </>
      )}
    </div>
  </motion.div>
);

const NotificationsContent = () => (
  <div>
    <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 text-transparent bg-clip-text">
      Notifications
    </h2>
    {/* Notifications list */}
  </div>
);

const SettingsContent = () => {
  const { setUser, user } = useUser();
  const router = useRouter();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    type: "success",
    message: "",
  });
  const [cliToken, setCliToken] = useState("");
  const [hasCliToken, setHasCliToken] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [showNameForm, setShowNameForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [username, setUsername] = useState(user.username || "");
  useEffect(() => {
    loadCliToken();
  }, []);

  const loadCliToken = async () => {
    const resp = await getCliToken();
    if (resp.status === 200) {
      setHasCliToken(Boolean(resp.data.exists));
    }
  };

  const handleGenerateToken = async () => {
    setIsLoadingToken(true);
    const resp = await generateCliToken();
    if (resp.status === 201 && resp.data.token) {
      setCliToken(resp.data.token);
      setHasCliToken(true);
      setShowToken(true);
      setIsToastVisible(true);
      setToastMessage({
        type: "success",
        message: "CLI token generated successfully!",
      });
    } else {
      setIsToastVisible(true);
      setToastMessage({
        type: "error",
        message: resp.data.message || "Failed to generate CLI token!",
      });
    }
    setIsLoadingToken(false);
  };

  const handleRevokeToken = async () => {
    setIsLoadingToken(true);
    const resp = await revokeCliToken();
    if (resp.status === 201) {
      setCliToken("");
      setHasCliToken(false);
      setShowToken(false);
      setIsToastVisible(true);
      setToastMessage({
        type: "success",
        message: "CLI token revoked successfully!",
      });
    } else {
      setIsToastVisible(true);
      setToastMessage({
        type: "error",
        message: resp.data.message || "Failed to revoke CLI token!",
      });
    }
    setIsLoadingToken(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const resp = await changePassword(oldPassword, newPassword);
    if (resp.status === 201) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setIsToastVisible(true);
      setToastMessage({
        type: "success",
        message: "Password updated successfully!",
      });
    } else {
      setIsToastVisible(true);
      setToastMessage({
        type: "error",
        message: resp.data.message || "Failed to update password!",
      });
    }
  };

  const getHiddenToken = (token) => {
    if (!token) return "";
    const start = token.slice(0, 4);
    const end = token.slice(-4);
    return `${start}${"•".repeat(20)}${end}`;
  };

  const decodeEmail = () => {
    const encoded =
      "115,117,112,112,111,114,116,64,99,111,109,112,105,102,121,46,97,112,112";
    return encoded
      .split(",")
      .map((char) => String.fromCharCode(parseInt(char)))
      .join("");
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    window.location.href = `mailto:${decodeEmail()}`;
  };

  const handleDeleteAccount = async () => {
    const resp = await deleteUser();
    if (resp.status === 200 || resp.status === 201) {
      router.push("/");
      setUser({});
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      router.push("/");
      setUser({});
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
      setShowDeleteModal(false);
    } else {
      setShowDeleteModal(false);
      setIsToastVisible(true);
      setToastMessage({
        type: "error",
        message: resp.data.message || "Failed to delete account!",
      });
    }
  };

  return (
    <div className="mx-auto w-full overflow-hidden">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 text-transparent bg-clip-text">
        Account Settings
      </h2>
      <div className="flex flex-col gap-8 mb-8 w-full">
        <div className="w-full flex flex-col gap-6">
          <motion.div
            className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-full flex flex-col"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              isolation: "isolate",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
              opacity: 0.95,
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
              transition: { duration: 0.3 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
              style={{
                transformStyle: "preserve-3d",
              }}
            />
            <GradientSpot
              color="#10b981"
              size={100}
              position={{ x: "0%", y: "-10%" }}
              opacity={0.2}
            />
            <GradientSpot
              color="#059669"
              size={180}
              position={{ x: "0%", y: "10%" }}
              opacity={0.2}
            />

            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-6 h-6 text-emerald-500" />
              <h3 className="text-2xl font-semibold">CLI Access Token</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Securely manage your CLI access token for command-line
              interactions with the platform.
            </p>

            {cliToken ? (
              <div className="flex flex-col gap-4">
                <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-white/5">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Key className="w-4 h-4 text-emerald-500/70" />
                    <span className="select-all">
                      {showToken ? cliToken : getHiddenToken(cliToken)}
                    </span>
                  </div>
                </div>
                <p className="text-amber-300/80 text-sm">
                  Copy this token now. For security it will not be shown again.
                </p>
                <div className="flex justify-between gap-4">
                  <Button
                    text="Copy Token"
                    variant="full"
                    size="small"
                    Icon={Copy}
                    showIcon={true}
                    onClick={() => {
                      navigator.clipboard.writeText(cliToken);
                      setIsToastVisible(true);
                      setToastMessage({
                        type: "success",
                        message: "Token copied to clipboard!",
                      });
                    }}
                  />
                  <Button
                    text="Revoke Token"
                    variant="full"
                    size="small"
                    color="red"
                    showIcon={false}
                    onClick={handleRevokeToken}
                    disabled={isLoadingToken}
                  />
                </div>
              </div>
            ) : hasCliToken ? (
              <div className="flex flex-col gap-4">
                <p className="text-gray-300">
                  A CLI token is configured. Its secret is stored hashed and
                  cannot be displayed again.
                </p>
                <div className="flex justify-between gap-4">
                  <Button
                    text={
                      isLoadingToken ? "Regenerating..." : "Regenerate Token"
                    }
                    variant="full"
                    size="small"
                    onClick={handleGenerateToken}
                    disabled={isLoadingToken}
                  />
                  <Button
                    text="Revoke Token"
                    variant="full"
                    size="small"
                    color="red"
                    showIcon={false}
                    onClick={handleRevokeToken}
                    disabled={isLoadingToken}
                  />
                </div>
              </div>
            ) : (
              <Button
                text={isLoadingToken ? "Generating..." : "Generate Token"}
                variant="full"
                size="small"
                icon={<Terminal className="w-4 h-4" />}
                onClick={handleGenerateToken}
                disabled={isLoadingToken}
              />
            )}
          </motion.div>
          <motion.div
            className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-full flex flex-col"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              isolation: "isolate",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
              opacity: 0.95,
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
              transition: { duration: 0.3 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
              style={{
                transformStyle: "preserve-3d",
              }}
            />
            <GradientSpot
              color="#9333ea"
              size={100}
              position={{ x: "0%", y: "-10%" }}
              opacity={0.2}
            />
            <GradientSpot
              color="#6b21a8"
              size={180}
              position={{ x: "0%", y: "10%" }}
              opacity={0.2}
            />

            <div className="flex items-center gap-3 mb-4">
              <User2 className="w-6 h-6 text-purple-500" />
              <h3 className="text-2xl font-semibold">Personal Information</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Update your name and personal details.
            </p>

            {!showNameForm ? (
              <Button
                text="Update Personal Information"
                variant="full"
                size="small"
                showIcon={false}
                onClick={() => setShowNameForm(true)}
              />
            ) : (
              <div className="flex flex-col gap-4 max-w-md">
                <div className="flex space-x-4">
                  <InputField
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    Icon={User}
                  />
                  <InputField
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    Icon={User}
                  />
                </div>
                <InputField
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  Icon={() => <span className="text-gray-400">@</span>}
                />
                <div className="flex gap-2 w-full justify-between">
                  <Button
                    text="Cancel"
                    variant="full"
                    size="small"
                    color="red"
                    showIcon={false}
                    onClick={() => setShowNameForm(false)}
                  />
                  <Button
                    text="Save Changes"
                    textSm="Save"
                    variant="full"
                    size="small"
                    showIcon={false}
                    onClick={async () => {
                      try {
                        const resp = await updateUserInfo({
                          firstName,
                          lastName,
                          username,
                        });
                        if (resp.status === 200 || resp.status === 201) {
                          setUser({ ...user, firstName, lastName, username });
                          setIsToastVisible(true);
                          setToastMessage({
                            type: "success",
                            message: "Information updated successfully!",
                          });
                          setShowNameForm(false);
                        } else {
                          setIsToastVisible(true);
                          setToastMessage({
                            type: "error",
                            message:
                              resp.data?.message ||
                              "Failed to update information!",
                          });
                        }
                      } catch (error) {
                        console.error("Update error:", error);
                        setIsToastVisible(true);
                        setToastMessage({
                          type: "error",
                          message:
                            error.response?.data?.message ||
                            "Failed to update information. Please try again.",
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-full flex flex-col"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              isolation: "isolate",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
              opacity: 0.95,
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
              transition: { duration: 0.3 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
              style={{
                transformStyle: "preserve-3d",
              }}
            />
            <GradientSpot
              color="#3b82f6"
              size={100}
              position={{ x: "0%", y: "-10%" }}
              opacity={0.2}
            />
            <GradientSpot
              color="#1e40af"
              size={180}
              position={{ x: "0%", y: "10%" }}
              opacity={0.2}
            />
            <h3 className="text-2xl font-semibold mb-4">Account Security</h3>
            <p className="text-gray-400 mb-4">
              Update your password easily to maintain your account&apos;s
              security and privacy.
            </p>

            {!showPasswordForm ? (
              <Button
                text="Change Password"
                variant="full"
                size="small"
                showIcon={false}
                onClick={() => setShowPasswordForm(true)}
              />
            ) : (
              <form
                onSubmit={handleChangePassword}
                className="flex flex-col gap-4 max-w-md"
              >
                <InputField
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <InputField
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <InputField
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div className="flex gap-2 w-full justify-between">
                  <Button
                    text="Cancel"
                    variant="full"
                    size="small"
                    color="red"
                    showIcon={false}
                    onClick={() => setShowPasswordForm(false)}
                  />
                  <Button
                    text="Update Password"
                    textSm="Update"
                    variant="full"
                    size="small"
                    type="submit"
                    showIcon={false}
                  />
                </div>
              </form>
            )}
          </motion.div>

          <p className="text-gray-400 w-full mt-8 text-right">
            Need help?{" "}
            <a
              href="#"
              onClick={handleContactClick}
              className="text-purple-500 hover:text-purple-400 transition-colors"
            >
              Contact us
            </a>
          </p>
          <motion.div
            className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[#d84d4d1c] p-6 w-full h-full flex flex-col"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
              opacity: 0.95,
              boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
              transition: { duration: 0.3 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
              style={{
                transformStyle: "preserve-3d",
              }}
            />
            <h3 className="text-2xl font-semibold mb-4 text-red-400">
              Danger Zone
            </h3>
            <p className="text-gray-400 mb-4">
              Deleting your account is permanent and cannot be undone. Please
              proceed with caution.
            </p>
            <Button
              text="Delete Account"
              variant="full"
              color="red"
              size="small"
              showIcon={false}
              onClick={() => setShowDeleteModal(true)}
            />
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="red"
        confirmationString="delete my account"
      />

      {isToastVisible && (
        <Toast
          message={toastMessage.message}
          duration={3000}
          type={toastMessage.type}
          onClose={() => setIsToastVisible(false)}
        />
      )}
    </div>
  );
};

const TermsSupportContent = () => {
  const links = [
    {
      title: "Terms of Service",
      description: "Read our terms and conditions",
      icon: FileText,
      link: "/terms",
      color: "#f59e0b",
    },
    {
      title: "Privacy Policy",
      description: "Learn about data protection",
      icon: Shield,
      link: "/privacy",
      color: "#ec4899",
    },
    {
      title: "Community",
      description: "Join our developer community",
      icon: Activity,
      link: "https://discord.gg/FY7SZTVW",
      color: "#8b5cf6",
    },
  ];

  const decodeEmail = () => {
    const encoded =
      "115,117,112,112,111,114,116,64,99,111,109,112,105,102,121,46,97,112,112";
    return encoded
      .split(",")
      .map((char) => String.fromCharCode(parseInt(char)))
      .join("");
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    window.location.href = `mailto:${decodeEmail()}`;
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="mx-auto w-full overflow-hidden">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 text-transparent bg-clip-text">
        Terms & Support
      </h2>

      <div className="flex flex-col gap-8">
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
          {links.map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 h-full flex flex-col"
              style={{
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                isolation: "isolate",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
                style={{ transformStyle: "preserve-3d" }}
              />
              <GradientSpot
                color={item.color}
                size={100}
                position={{ x: "0%", y: "-10%" }}
                opacity={0.2}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <item.icon
                    className="w-6 h-6"
                    style={{ color: item.color }}
                  />
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                </div>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Contact Support Banner */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-blue-500/5 p-3 sm:p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-2 rounded-xl bg-purple-500/10">
                <Mail size={18} className="text-purple-300" />
              </div>
              <p className="text-sm font-medium text-gray-200">
                <span className="hidden sm:inline">
                  Need help? Our support team is here to assist you
                  (support@compify.app)
                </span>
                <span className="sm:hidden">
                  Contact support team (support@compify.app)
                </span>
              </p>
            </div>
            <Button
              text="Contact"
              showIcon={false}
              color="purple"
              size="small"
              blurBackground={true}
              onClick={handleContactClick}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default withAuth(UserProfilePage);
