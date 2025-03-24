import { Amplify } from 'aws-amplify'
import awsExports from '../config/awsExports'

Amplify.configure(awsExports)

export default Amplify
