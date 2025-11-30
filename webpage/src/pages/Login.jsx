// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { useToast } from '../features/toast/useToast';
import { useNavigate } from 'react-router-dom';
import { roles } from '../constants/roles';
import { routes } from '../constants/routes';
import Button from '../components/ui/Button';

import logoSrc from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword(v => !v);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      toast('Login successful!', 'success');
      const dest =
        user.role === roles.ADMIN
          ? routes.ADMIN_DASHBOARD
          : routes.PARENT_DASHBOARD;
      navigate(dest, { replace: true });
    } catch (err) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header with logo */}
      <header className="p-4 bg-white shadow-sm">
        <img src={logoSrc} alt="Roz & Kirsty Photography" className="h-10" />
      </header>

      {/* Centered login form */}
      <main className="flex-grow flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
        >
          <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

          <label className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="w-full border-gray-300 border px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label className="block mb-2 font-medium">Password</label>
          <div className="relative mb-6">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full border-gray-300 border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full"
          >
            Login
          </Button>
        </form>
      </main>
    </div>
  );
}
