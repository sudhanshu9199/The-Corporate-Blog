"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/store";

// Role-based redirect — extracted so both handlers share the same logic
const redirectByRole = (role: string, push: (path: string) => void) => {
  if (role === "admin" || role === "editor") {
    push("/dashboard");
  } else {
    push("/");
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError("");
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      const { accessToken, user } = data;

      localStorage.setItem("accessToken", accessToken); // ← consistent key
      setUser(user);                                     // ← hydrate auth store
      redirectByRole(user.role, router.push);
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      const { accessToken, user } = data;

      localStorage.setItem("accessToken", accessToken);
      setUser(user);
      redirectByRole(user.role, router.push);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      setError(axiosErr.response?.data?.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          The Corporate Blog 🏢
        </h2>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition duration-200"
          >
            Sign In
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in failed. Please try again.")}
            useOneTap
          />
        </div>
      </div>
    </div>
  );
}
