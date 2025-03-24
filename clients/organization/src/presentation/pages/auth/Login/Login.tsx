import React from 'clients/commons/platform/node_modules/@types/react';
import { Link } from 'react-router-dom';
import { FaRegEye, FaRegEyeSlash, MdOutlineMail } from '../../../assets/icons';

import InputField from '../../../components/input-fields';
import { Toast } from '../../../components/toast';
import { SignupPath } from '../../../../constants/routeConsts';
import Button from '../../../components/button';
import { useLogin } from './useLogin';

const Login: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    toastVisible,
    toastMsg,
    toastClass,
    loading,
    showPassword,
    handleTogglePasswordVisibility,
    handleLogin,
  } = useLogin();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg">
        <h2 className="font-bold text-xl text-center mb-6">Sign In</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
        >
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
              <Link
                to="/forgot-password"
                className="text-blue-500 hover:underline text-primary"
              >
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
              } hover:bg-brandprimary_2`}
              disabled={loading}
            />
          </div>

          <div className="text-center">
            <p className="text-sm">
              Don’t have an account?{' '}
              <Link
                to={SignupPath}
                className="text-blue-500 hover:underline text-primary"
              >
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
