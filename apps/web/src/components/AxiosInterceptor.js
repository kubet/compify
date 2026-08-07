"use client";
import { useEffect } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

export default function AxiosInterceptor() {
  useEffect(() => {
    // Remove bearer JWTs left by pre-cookie releases.
    localStorage.removeItem("token");
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return null;
}
