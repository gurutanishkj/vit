import React, { useState } from 'react';
import { Shield, AlertCircle, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Please try again.');
      }

      // Store JWT token and user info
      localStorage.setItem('fraudshield_token', data.access_token);
      localStorage.setItem('fraudshield_user', JSON.stringify(data.user));
      onRegisterSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf6] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md">
          <Shield className="w-7 h-7" />
        </div>
        <div>
          <span className="text-2xl font-extrabold tracking-tight text-[#1c1917]">FraudShield</span>
          <span className="block text-xs font-semibold text-orange-600 tracking-wider uppercase">Code Cortex 3.0 • VIT</span>
        </div>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-[#f4ede2] border border-[#e4d8c5] rounded-2xl p-8 shadow-fintech">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#1c1917]">Create your FraudShield account</h1>
          <p className="text-sm text-[#78716c] mt-1">Start monitoring financial transactions securely.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-100/70 border border-red-300 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-white border border-[#dcd1be] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1c1917] outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-[#dcd1be] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1c1917] outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#dcd1be] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1c1917] outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#44403c] mb-1.5 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#a8a29e] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#dcd1be] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1c1917] outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-600/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#e4d8c5] text-center">
          <p className="text-xs text-[#78716c]">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-orange-600 font-semibold hover:underline ml-1"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
