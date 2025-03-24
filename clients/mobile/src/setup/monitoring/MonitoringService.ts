import type { IMonitoringService } from './IMonitoringService'
import CrashlyticsMonitoringService from './CrashlyticsService'

let instance: IMonitoringService = new CrashlyticsMonitoringService()

const Monitoring = {
  setImplementation (monitoringService: IMonitoringService): void {
    instance = monitoringService
  },

  log (message: string): void {
    instance.log(message)
  },

  recordError (error: Error): void {
    instance.recordError(error)
  },

  setUserId (userId: string): void {
    instance.setUserId(userId)
  },

  setAttributes (attributes: Record<string, string>): void {
    instance.setAttributes(attributes)
  },

  crash (): void {
    instance.crash()
  }
}

export default Monitoring
