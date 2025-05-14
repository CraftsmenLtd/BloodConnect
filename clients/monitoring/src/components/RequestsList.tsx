import { useRef } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

type RequestsListProps = {
    data: unknown[];
    onDataSubmit: (id: string) => void;
}

const RequestsList = ({
  data,
  onDataSubmit
}: RequestsListProps) => {
  const requestId = useRef<HTMLSelectElement>(null)

  return (
    <Card
      style={{ width: '18rem', zIndex: 1, margin: '4px', position: 'relative' }}
      data-bs-theme="dark">
      <Card.Body>
        <Form.Group controlId="donationStatus" className="mb-2">
          <Form.Label>Status</Form.Label>
          <Form.Select
            ref={requestId}
            required
          >
            {data.map(item => {
              const parsedId = item.PK.split('BLOOD_REQ#')[1]
              return <option key={parsedId} value={parsedId}>
                {parsedId}
              </option>
            } )}
          </Form.Select>
        </Form.Group>
        <Button
          onClick={() => {
            if (requestId.current?.value) {
              onDataSubmit(requestId.current?.value)
            }
          }}
          variant="primary">
          Search
        </Button>
      </Card.Body>
    </Card>
  );
};

export default RequestsList;
