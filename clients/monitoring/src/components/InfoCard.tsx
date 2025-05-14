import { useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { DonationStatus } from '../../../../commons/dto/DonationDTO'

export type Data = {
  startTime: number;
  endTime: number;
  centerHash: string;
  country: string;
  status: DonationStatus;
}

type InfoCardProps = {
  data: Data;
  onCenterHashChange?: (geohash: string) => void;
  onDataSubmit?: (data: Data) => void | Promise<(data: Data) => void>;
}

const InfoCard = ({
  data,
  onCenterHashChange,
  onDataSubmit
}: InfoCardProps) => {
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const centerHashRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null)

  const handleSubmit = () => {
    if (
      !startTimeRef.current?.value
      && !endTimeRef.current?.value
      && !centerHashRef.current?.value
      && !countryRef.current?.value
      && !statusRef.current?.value
    ) {
      return
    }

    const startTimeUnix = new Date(startTimeRef.current!.value).getTime();
    const endTimeUnix = new Date(endTimeRef.current!.value).getTime();

    onDataSubmit?.({
      startTime: startTimeUnix,
      endTime: endTimeUnix,
      centerHash: centerHashRef.current!.value,
      country: countryRef.current!.value,
      status: statusRef.current!.value as DonationStatus,
    });
  };

  return (
    <Card
      style={{ width: '18rem', zIndex: 1, margin: '4px', position: 'relative' }}
      data-bs-theme="dark">
      <Card.Body>
        <Form.Group className="mb-2">
          <Form.Label>Geohash</Form.Label>
          <Form.Control
            type="text"
            value={data.centerHash}
            ref={centerHashRef}
            onChange={(e) => {
              onCenterHashChange?.(e.target.value)
            }}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Country Code</Form.Label>
          <Form.Control
            type="text"
            defaultValue={data.country}
            ref={countryRef}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Start Time</Form.Label>
          <Form.Control
            type="datetime-local"
            defaultValue={new Date(data.startTime).toISOString().slice(0, 16)}
            ref={startTimeRef}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>End Time</Form.Label>
          <Form.Control
            type="datetime-local"
            defaultValue={new Date(data.endTime).toISOString().slice(0, 16)}
            ref={endTimeRef}
          />
        </Form.Group>

        <Form.Group controlId="donationStatus" className="mb-2">
          <Form.Label>Status</Form.Label>
          <Form.Select
            defaultValue={data.status}
            ref={statusRef}
            required
          >
            {Object.values(DonationStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Button
          onClick={handleSubmit}
          variant="primary">
          Search
        </Button>
      </Card.Body>
    </Card>
  );
};

export default InfoCard;
