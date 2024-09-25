import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import authService from '@shared/services/authService';
import useAuthenticatedUser from '@web/hooks/useAuthenticatedUser';
import Button from '@web/presentation/components/button';
import InputField from '@web/presentation/components/input-fields';
import PasswordField from '@web/presentation/components/input-fields/PasswordInput';
import { Toast } from '@web/presentation/components/toast';
import { toastHideDisappearTime } from '@web/constants/common';
import { DashboardPath, LoginPath } from '@web/constants/routeConsts';
import { validatePassword } from '@web/utils/validationUtils';
import { MdOutlineMail, HiOutlinePhone } from '@web/presentation/assets/icons';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+88');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastClass, setToastClass] = useState('');
  const { user } = useAuthenticatedUser();
  const [loading, setLoading] = useState(false);

  const handleError = (error: string) => {
    setToastMsg(error);
    setToastClass('alert-error');
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, toastHideDisappearTime);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { isValid, error } = validatePassword(password, confirmPassword);
    if (isValid !== true) {
      handleError(error);
      return;
    }

    try {
      setLoading(true);

      const resp = await authService.registerOrganization({
        email,
        password,
        organizationName,
        phoneNumber,
      });

      if (resp.status === 201) {
        navigate(LoginPath);
      }
    } catch (error: any) {
      handleError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user != null) {
      navigate(DashboardPath);
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg">
        <div>
          <h2 className="font-bold text-xl text-center mb-6">Sign Up</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSignUp(e);
            }}
          >
            <InputField
              type="text"
              label="Organization Name"
              placeholder="Enter your organization name"
              value={organizationName}
              onChange={(e) => {
                setOrganizationName(e.target.value);
              }}
            />

            <InputField
              type="text"
              label="Contact Number"
              placeholder="Enter your contact number"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
              }}
              icon={<HiOutlinePhone />}
            />

            <InputField
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              icon={<MdOutlineMail />}
            />

            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
            />

            <PasswordField
              label="Re-type Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
            />

            <div className="mb-5">
              <Button
                type="submit"
                value={loading ? 'Loading..' : 'Create account'}
                className={`btn bg-primary w-full ${
                  loading ? 'cursor-not-allowed' : ''
                } hover:bg-primary-focus`}
                disabled={loading}
              />
            </div>

            <div className="mt-6 text-center">
              <p>
                Already have an account?{' '}
                <Link to={LoginPath} className="text-primary">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      <Toast msg={toastMsg} className={toastClass} visible={toastVisible} />
    </div>
  );
};

export default SignUp;
