'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFinShield } from '@/context/FinShieldContext';

const INPUT =
  'w-full h-11 px-4 rounded-2xl bg-[#F5F5F7] text-[15px] text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#1C1C1E]';
const LABEL = 'text-[13px] text-[#636366] block mb-1.5';

export default function LoginPage() {
  const router = useRouter();
  const { state, updateProfile } = useFinShield();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState(state.profile.name || 'Arjun Mehta');
  const [email, setEmail] = useState(state.profile.email || 'arjun.mehta@finshield.in');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Arjun Mehta',
      email: email.trim() || 'arjun.mehta@finshield.in',
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] bento-pod p-8 space-y-6">
        <div className="space-y-1">
          <Link href="/" className="text-[17px] font-semibold tracking-tight text-[#1C1C1E]">
            FinShield
          </Link>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.02em] pt-2">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-[15px] text-[#636366]">
            {mode === 'signin'
              ? 'Enter your email and password to continue.'
              : 'Set up your personal finance workspace.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className={LABEL}>
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className={LABEL}>
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="auth-password" className={LABEL}>
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#1C1C1E] text-white rounded-full h-11 px-5 text-[14px] font-medium cursor-pointer"
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-[13px] text-[#636366] text-center">
          {mode === 'signin' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="font-medium text-[#1C1C1E] underline min-h-[44px] cursor-pointer"
          >
            {mode === 'signin' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
