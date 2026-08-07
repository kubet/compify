"use client";

import { Suspense, useCallback, useEffect } from "react";
import { GradientSpot } from "@/components/Common";
import { Button } from "@/components/Elements";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import React from "react";
import { useUser } from "@/auth/UseUser";
import { refreshToken, whoAmI } from "@/lib/api";

function PaymentContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const router = useRouter();

  useEffect(() => {
    const particles = []; // Track all created particles

    if (success === "true") {
      const emojis = ["✨", "🎉", "💫", "⭐️", "🌟"];
      for (let i = 0; i < 20; i++) {
        const timeoutId = setTimeout(() => {
          const emoji = document.createElement("div");
          emoji.className = "celebration-particle";
          emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
          emoji.style.left = Math.random() * 100 + "vw";
          emoji.style.animationDuration = Math.random() * 3 + 2 + "s";
          emoji.style.opacity = Math.random();
          emoji.style.fontSize = Math.random() * 20 + 20 + "px";
          document.body.appendChild(emoji);
          particles.push(emoji);

          // Clean up single emoji after animation
          setTimeout(() => emoji.remove(), 5000);
        }, i * 150);

        // Store timeout ID for cleanup
        particles.push(timeoutId);
      }
    }

    // Cleanup function
    return () => {
      // Clear all timeouts
      particles.forEach((particle) => {
        if (typeof particle === "number") {
          clearTimeout(particle);
        } else if (particle instanceof Element) {
          particle.remove();
        }
      });
    };
  }, [success]);

  return (
    <>
      <style jsx global>{`
        .celebration-particle {
          position: fixed;
          top: -20px;
          pointer-events: none;
          animation: float-up 3s ease-in-out forwards;
          z-index: 100;
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) rotate(0deg);
          }
          50% {
            transform: translateY(50vh) rotate(180deg);
          }
          100% {
            transform: translateY(0vh) rotate(360deg);
          }
        }
      `}</style>
      <div className="relative flex h-[calc(100vh-72px)] flex-col items-center justify-center px-4 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
        <GradientSpot
          color={
            success === "true"
              ? "hsl(131.63deg 50.8% 67.08%)"
              : "hsl(359.99deg 50.8% 67.08%)"
          }
          size={500}
          position={{ x: "25%", y: "0%" }}
          opacity={0.15}
        />
        <div className="relative">
          <h1
            className="text-[12rem] font-black"
            style={{
              color: "rgba(255,255,255,0.05)",
              position: "relative",
            }}
          >
            {success === "true" ? "Success" : "Failed"}
          </h1>
          <h1
            className="text-[12rem] font-black absolute inset-0"
            style={{
              background:
                success === "true"
                  ? "linear-gradient(180deg, rgba(34,197,94,1) 0%, rgba(34,197,94,0.03) 100%)"
                  : "linear-gradient(180deg, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.03) 100%)",
              backgroundSize: "100% 100%",
              WebkitBackgroundClip: "text",
              color: "black",
              WebkitTextStroke: "3px transparent",
              mixBlendMode: "difference",
              opacity: 0.25,
            }}
          >
            {success === "true" ? "Success" : "Failed"}
          </h1>
        </div>

        {/* cta got to create */}
        {success === "true" ? (
          <Button
            className="mt-8"
            text="Start Creating"
            onClick={() => router.push("/create")}
          />
        ) : (
          <p className="text-lg text-gray-500 text-center">
            Payment Failed, please try again.
            <br />
            Contact support if the issue persists.
          </p>
        )}

        <p className="text-gray-400 w-full mt-8 text-center">
          Need help?{" "}
          <a
            href="mailto:support@compify.app"
            className="text-purple-500 hover:text-purple-400 transition-colors"
          >
            Contact us support@compify.app
          </a>
        </p>

        {/* <h2 className="absolute z-10 top-[55%] text-6xl bg-gradient-to-r leading-[5rem] from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent">
                    {success === 'true'
                        ? 'Payment Successful!'
                        : 'Payment Failed'}
                </h2> */}
      </div>
    </>
  );
}

function PaymentPage() {
  const { setUser } = useUser();

  const loadToken = useCallback(async () => {
    const resp = await refreshToken();
    if (resp.status === 201) {
      const usr = await whoAmI();
      setUser(usr.data);
    }
  }, [setUser]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

export default PaymentPage;
