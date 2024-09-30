import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const passwordBlacklist = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'letmein', 'password1',
    'iloveyou', 'admin', 'welcome', 'monkey', 'dragon', 'sunshine', 'football'
  ];

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8 || password.length > 64) {
      setError('Password must be between 8 and 64 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (passwordBlacklist.includes(password.toLowerCase())) {
      setError('Password is too common or easy to guess. Please choose a more secure password.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('Error signing up:', error);
      setError('Failed to create an account. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Signup</h1>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (8-64 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;

