import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaSpinner } from 'react-icons/fa';
import { auth, sendEmailVerification, checkEmailVerification } from '../firebase';
import './Auth.css';

const EmailVerification = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/signup');
      return;
    }

    const checkVerification = async () => {
      try {
        const isVerified = await checkEmailVerification();
        if (isVerified) {
          navigate('/dashboard');
        } else {
          setLoading(false);
        }
      } catch (error) {
        setError('Error checking verification status');
        setLoading(false);
      }
    };

    const interval = setInterval(checkVerification, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    try {
      await sendEmailVerification();
      setEmailSent(true);
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
            <FaEnvelope className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification email to{' '}
            <span className="font-medium">{auth.currentUser?.email}</span>
          </p>
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          {emailSent && (
            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              Verification email sent successfully!
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          <div className="text-sm text-gray-600">
            <p className="mb-4">
              Please check your email and click the verification link to continue.
              If you don't see the email, check your spam folder.
            </p>
            {loading ? (
              <div className="flex justify-center items-center space-x-2">
                <FaSpinner className="h-5 w-5 text-green-600 animate-spin" />
                <span>Checking verification status...</span>
              </div>
            ) : (
              <button
                onClick={handleResendEmail}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
              >
                Resend Verification Email
              </button>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
