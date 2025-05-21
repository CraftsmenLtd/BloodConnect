import React from 'clients/commons/platform/node_modules/@types/react'
import { Link } from 'react-router-dom'
import Button from '../../../components/button'
import InputField from '../../../components/input-fields'
import PasswordField from '../../../components/input-fields/PasswordInput'
import { Toast } from '../../../components/toast'
import { LoginPath } from '../../../../constants/routeConsts'
import { MdOutlineMail, HiOutlinePhone } from '../../../assets/icons'
import { useSignUp } from './useSignUp'

const SignUp: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    organizationName,
    setOrganizationName,
    phoneNumber,
    setPhoneNumber,
    handleSignUp,
    toastVisible,
    toastMsg,
    toastClass,
    passwordValidation,
    loading,
  } = useSignUp()

  const { passwordResults, confirmPasswordResult } = passwordValidation

  return (
    <div className="flex items-center justify-center my-4">
      <div className="w-full max-w-md p-6 rounded-lg shadow-lg">
        <h2 className="font-bold text-xl text-center mb-6">Sign Up</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSignUp()
          }}
        >
          <InputField
            type="text"
            label="Organization Name"
            placeholder="Enter your organization name"
            value={organizationName}
            onChange={(e) => {
              setOrganizationName(e.target.value)
            }}
          />

          <InputField
            type="text"
            label="Contact Number"
            placeholder="Enter your contact number"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value)
            }}
            icon={<HiOutlinePhone />}
          />

          <InputField
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            icon={<MdOutlineMail />}
          />

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            validationResults={passwordResults}
          />

          <PasswordField
            label="Re-type Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
            validationResults={[confirmPasswordResult]}
          />

          <div className="mb-5">
            <Button
              type="submit"
              value={loading ? 'Loading..' : 'Create Account'}
              className={`btn bg-primary text-white w-full ${loading ? 'cursor-not-allowed' : ''} hover:bg-brandprimary_2`}
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
      <Toast msg={toastMsg} className={toastClass} visible={toastVisible} />
    </div>
  )
}

export default SignUp
