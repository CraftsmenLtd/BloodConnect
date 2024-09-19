import { signIn } from 'aws-amplify/auth';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaRegEye,
  FaRegEyeSlash,
  MdOutlineMail,
} from '@/presentation/assets/icons';

import InputField from '@/presentation/components/input-fields';
import { Toast } from '@/presentation/components/toast';
import { DashboardPath, SignupPath } from '@/constants/routeConsts';
import useAuthenticatedUser from '@/application/hooks/useAuthenticatedUser';
import Button from '@/presentation/components/button';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastClass, setToastClass] = useState('');
  const { user } = useAuthenticatedUser();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleError = (error: string) => {
    setToastMsg(error);
    setToastClass('alert-error');
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn({
        username: email,
        password,
      });
      navigate(DashboardPath);
    } catch (error: any) {
      handleError(error.message);
    }

    setLoading(false);
  };
  useEffect(() => {
    if (user) {
      navigate(DashboardPath);
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg">
        <h2 className="font-bold text-xl text-center mb-6">Sign In</h2>

        <form onSubmit={handleLogin}>
          <InputField
            type="email"
            placeholder="Enter your email"
            label="Email"
            icon={<MdOutlineMail />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />

          <InputField
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            label="Password"
            className="input input-bordered w-full"
            icon={
              showPassword ? (
                <FaRegEyeSlash
                  onClick={handleTogglePasswordVisibility}
                  size={22}
                  className="cursor-pointer"
                />
              ) : (
                <FaRegEye
                  onClick={handleTogglePasswordVisibility}
                  size={22}
                  className="cursor-pointer"
                />
              )
            }
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />

          <div className="mb-4">
            <p className="text-sm">
              <Link to="" className="text-blue-500 hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>

          <div className="mb-5">
            <Button
              type="submit"
              value={loading ? 'Loading..' : 'Login'}
              className={`btn bg-primary text-white w-full ${
                loading ? 'cursor-not-allowed' : ''
              } hover:bg-primary-focus`}
              disabled={loading}
            />
          </div>

          <div className="text-center">
            <p className="text-sm">
              Don’t have an account?{' '}
              <Link to={SignupPath} className="text-blue-500 hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </form>

        <Toast msg={toastMsg} className={toastClass} visible={toastVisible} />
      </div>
    </div>
  );
};

export default Login;
