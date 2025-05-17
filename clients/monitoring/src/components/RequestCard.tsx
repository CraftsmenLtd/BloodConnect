import { Accordion, Table } from 'react-bootstrap'
import type {
  CompleteRequest,
  DynamoDBNumber,
  NotificationDynamoDBUnmarshaledItem
} from '../constants/types'
import { AcceptDonationStatus } from '../../../../commons/dto/DonationDTO'

type RequestCardProps = {
    data: CompleteRequest;
    onHeaderClick: (requestId: string) => void;
};

const RequestCard = ({ data, onHeaderClick }: RequestCardProps) => {
  const requestId = data.SK.S.split('#')[2]

  const fieldsToIgnore = [
    'LSI1SK', 'GSI1SK',
    'PK', 'SK', 'GSI1PK', 'latitude', 'longitude',
    'patientName', 'shortDescription', 'transportationInfo',
    'geohash',
    'notifiedDonors',
  ]

  const groupedDonorStatuses = data.notifiedDonors?.reduce((acc, item) => {
    const status = item.status.S;
    (acc[status as AcceptDonationStatus] ??= []).push(item)
    return acc
  }, {} as Partial<Record<AcceptDonationStatus, NotificationDynamoDBUnmarshaledItem[]>>
  )

  return (
    <Accordion className="text-light rounded border-0">
      <Accordion.Item eventKey="0" className="border-0">
        <Accordion.Header className="border-0">{requestId}</Accordion.Header>
        <Accordion.Body className="bg-dark text-light p-0 border-0" 
          onEnter={() => onHeaderClick(requestId) }>
          <Table variant="dark" striped size="sm" className="mb-0">
            <tbody>
              {Object.entries(data)
                .filter(([key]) => !fieldsToIgnore.find(field => field === key))
                .map(([key, value]) => {
                  const displayKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, s => s.toUpperCase())
                  return (
                    <tr key={key}>
                      <td><strong>{displayKey}</strong></td>
                      <td>
                        {
                          'S' in value
                            ? (key === 'createdAt' || key === 'donationDateTime'
                              ? new Date(value.S).toLocaleString()
                              : value.S)
                            : (value as DynamoDBNumber).N
                        }
                      </td>
                    </tr>
                  )
                })}
              {groupedDonorStatuses &&
                <>
                  <tr>
                    <td>Accepted By</td>
                    <td>{
                      groupedDonorStatuses[AcceptDonationStatus.ACCEPTED]?.
                        length}</td>
                  </tr>
                  <tr>
                    <td>Pending For</td>
                    <td>{groupedDonorStatuses[AcceptDonationStatus.PENDING]?.
                      length}</td>
                  </tr>
                  <tr>
                    <td>Ignored By</td>
                    <td>{groupedDonorStatuses[AcceptDonationStatus.IGNORED]?.
                      length}</td>
                  </tr>
                </>
              }

            </tbody>
          </Table>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>

  )
}

export default RequestCard
