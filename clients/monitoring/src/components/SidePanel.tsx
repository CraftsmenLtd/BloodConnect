import { Offcanvas, Stack, } from 'react-bootstrap'
import type { BloodGroup } from '../../../../commons/dto/DonationDTO'
import RequestCard from './RequestCard'
import type { BloodRequestDynamoDBUnmarshaledItem } from '../constants/types'

export type SidePanelProps = {
  onClose: () => void;
  requests: BloodRequestDynamoDBUnmarshaledItem[];
  geohash: string;
  bloodGroup: BloodGroup;
  onCardClick: (requestId: string) => void;
}

const SidePanel = ({
  onClose,
  requests,
  geohash,
  bloodGroup,
  onCardClick
}: SidePanelProps) => {
  return (
    <Offcanvas
      show
      placement='end'
      backdrop={false} 
      className="bg-dark text-white"
      onHide={onClose}
    >
      <Offcanvas.Header closeButton closeVariant="white">
        <Offcanvas.Title>{bloodGroup} requests in {geohash}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Stack gap={2}>
          {
            requests.map((request, index) => (
              <RequestCard
                data={request} key={index} onHeaderClick={onCardClick}/>
            ))
          }
        </Stack>
      </Offcanvas.Body>
    </Offcanvas>
  )
}

export default SidePanel
