"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, CircleAlert, X } from "lucide-react";
import { GradientSpot } from "@/components/Common";
import { Button, InputField } from "@/components/Elements";
import { loginUser, whoAmI, loginWithGoogle } from "@/lib/api";
import { useUser } from "@/auth/UseUser";
import { useRouter } from "next/navigation";
import { baseUrl } from "@/constains";
import GoogleButton from "@/components/Login/GoogleButton";
import MiniButton from "@/components/Elements/MiniButton";

const LoginPage = () => {
  const { setUser } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showBanner, setShowBanner] = useState(false);

  const checkBrowserAndDevice = () => {
    if (typeof window !== "undefined") {
      const isChromiumBased = !!window.chrome;
      const isMobileSize = window.innerWidth < 768; // Standard tablet breakpoint

      // Show banner if NOT (desktop size AND chromium-based)
      setShowBanner(!(!isMobileSize && isChromiumBased));
    }
  };

  useEffect(() => {
    checkBrowserAndDevice();
    // Add resize listener to update banner state on window resize
    window.addEventListener("resize", checkBrowserAndDevice);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", checkBrowserAndDevice);
  }, []);

  const handleLogin = async () => {
    if (email === "" || password === "") {
      setErrorMsg("Please enter your email and password");
      return;
    }
    const resp = await loginUser({ email, password });
    if (resp.status === 201) {
      const usr = await whoAmI();
      setUser(usr.data);
      const afterLoginForwardLink = localStorage.getItem(
        "afterLoginForwardLink"
      );
      if (afterLoginForwardLink) {
        localStorage.removeItem("afterLoginForwardLink");
        router.push(afterLoginForwardLink);
      } else {
        router.push("/profile");
      }
    } else {
      if (resp.data.message === "Please verify your email first.") {
        console.log(email);
        router.push(`/verify/email?a=${email}`);
      } else {
        setErrorMsg(resp.data.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    window.location.href = `${baseUrl}/auth/google`;
  };

  return (
    <div
      className="flex bg-black text-white items-center justify-center"
      style={{ height: "calc(100vh - 72px)" }}
    >
      {showBanner && (
        <motion.div
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
          }}
          initial="initial"
          animate="animate"
          className="absolute z-50 max-w-7xl px-4 top-20 w-[90%] sm:w-[95%] lg:w-full rounded-2xl border border-white/10 bg-[#0b0b0b]  sm:bg-transparent p-3 sm:p-4"
        >
          <div className="absolute inset-0 md:bg-gradient-to-r md:from-purple-500/10 md:via-purple-500/5 md:to-blue-500/5 rounded-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-2 rounded-xl bg-purple-500/10">
                <CircleAlert size={18} className="text-purple-300" />
              </div>
              <p className="text-sm font-medium text-gray-200">
                For the best experience, use a Chromium-based browser with a
                desktop.
              </p>
            </div>
            <div
              className="cursor-pointer p-2"
              onClick={() => setShowBanner(false)}
            >
              <X size={18} className="text-gray-200" />
            </div>
          </div>
        </motion.div>
      )}
      <motion.div
        className="w-full lg:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hidden md:block">
          <GradientSpot
            color="#0066ff"
            size={500}
            position={{ x: "-30%", y: "-30%" }}
            opacity={0.15}
          />
          <GradientSpot
            color="#00ffff"
            size={500}
            position={{ x: "30%", y: "30%" }}
            opacity={0.15}
          />
        </div>
        <div className="block md:hidden">
          <GradientSpot
            color="#0066ff"
            size={250}
            position={{ x: "-15%", y: "-15%" }}
            opacity={0.15}
          />
          <GradientSpot
            color="#00ffff"
            size={250}
            position={{ x: "15%", y: "15%" }}
            opacity={0.15}
          />
        </div>

        <div className="w-full space-y-8 relative z-10 max-w-[400px]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-400">
              Please enter your details to sign in
            </p>
          </motion.div>

          <div className="space-y-6">
            <InputField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              Icon={Mail}
            />

            <InputField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              Icon={Lock}
              showButton={true}
              disableEnter={true}
              onSubmit={() => setShowPassword(!showPassword)}
              RightIcon={showPassword ? EyeOff : Eye}
            />

            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-red-700">{errorMsg} </p>
              <a
                href="/login/forgot-password"
                className="text-sm text-blue-400 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <div className="gap-5 flex flex-col">
            <Button
              text="Sign In"
              variant="full"
              onClick={handleLogin}
              fullWidth={true}
            />

            <div className="relative flex items-center gap-3">
              <div className="w-full border-t border-gray-700"></div>
              <span className="text-sm text-gray-400 whitespace-nowrap">
                Or continue to
              </span>
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="w-full flex justify-center">
              <GoogleButton onClick={handleGoogleLogin} />
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Sign up with email
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
