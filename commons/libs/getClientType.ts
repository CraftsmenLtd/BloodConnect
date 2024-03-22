import ClientType from '@commons/libs/constants/ClientType'

export default function getClientType(userAgent: string): ClientType {
  const isMobile = /iPhone|iPad|iPod|webOS|Android|Windows Phone|BlackBerry/i.test(userAgent)
  return isMobile ? 'mobile' : 'web'
}
