import React from 'clients/commons/platform/node_modules/@types/react'
import { FaCheck, IoClose } from '../../assets/icons'

type ValidationResult = {
  message: string;
  isValid: boolean;
};

type PasswordCriteriaCheckerProps = {
  validationResults: ValidationResult[];
}

const PasswordCriteriaChecker: React.FC<PasswordCriteriaCheckerProps> = ({
  validationResults,
}) => (
  <ul className="mb-3 text-sm">
    {validationResults.map((result) => (
      <li
        className="flex"
        key={result.message}
        style={{ color: result.isValid ? 'green' : 'red' }}
      >
        <span className="pr-1 pt-1">
          {result.isValid ? (
            <FaCheck color="green" />
          ) : (
            <IoClose color="red" />
          )}
        </span>
        <span>{result.message}</span>
      </li>
    ))}
  </ul>
)

export default PasswordCriteriaChecker
