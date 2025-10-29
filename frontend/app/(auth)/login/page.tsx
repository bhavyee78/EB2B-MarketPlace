'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, Phone } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Background Image */}
          <div className="mb-8 -mx-8 -mt-8">
            <div className="relative h-64 rounded-t-3xl overflow-hidden">
              <Image
                src="/easter-collection.jpg"
                alt="Easter Decorations"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-800 rounded-full p-4 w-24 h-24 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">Premier</div>
            </div>
          </div>

          <h2 className="text-center text-sm text-gray-600 mb-6">
            DECORATIONS LIMITED
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Outlet ID / Mobile Number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white rounded-full font-medium hover:from-pink-500 hover:to-pink-600 transition"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-gray-600 text-sm hover:text-pink-500">
              Forgot Password
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}