"use client";
import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

axios.defaults.withCredentials = true;

export default function AxiosInterceptor() {
  const router = useRouter();

  useEffect(() => {
    // Remove bearer JWTs left by pre-cookie releases.
    localStorage.removeItem("token");
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
          localStorage.removeItem("user");
          router.push("/login");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router]);

  return null;
}
