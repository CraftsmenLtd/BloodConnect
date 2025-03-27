import crashlytics from '@react-native-firebase/crashlytics'
import type { IMonitoringService } from './IMonitoringService'

class CrashlyticsMonitoringService implements IMonitoringService {
  log (message: string): void {
    crashlytics().log(message)
  }

  recordError (error: Error): void {
    crashlytics().recordError(error)
  }

  setUserId (userId: string): void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    crashlytics().setUserId(userId).catch(() => {})
  }

  setAttributes (attributes: Record<string, string>): void {
    Object.keys(attributes).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      crashlytics().setAttribute(key, attributes[key]).catch(() => {})
    })
  }

  crash (): void {
    crashlytics().crash()
  }
}

export default CrashlyticsMonitoringService
