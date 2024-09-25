import { Amplify } from 'aws-amplify'
import awsExports from './awsExports'

Amplify.configure(awsExports)

export default Amplify
