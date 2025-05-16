import { Accordion, Table } from 'react-bootstrap';

type RequestData = {
  [key: string]: { S?: string; N?: string };
};

type RequestCardProps = {
  data: RequestData;
};

const RequestCard = ({ data }: RequestCardProps) => {
  const requestId = data.PK?.S?.split('BLOOD_REQ#')[1];

  const fieldsToIgnore = new Set([
    'LSI1SK', 'GSI1SK',
    'PK', 'SK', 'GSI1PK', 'latitude', 'longitude',
    'patientName', 'shortDescription', 'transportationInfo',
  ]);

  return (
    <Accordion className="text-light rounded border-0">
      <Accordion.Item eventKey="0" className="border-0">
        <Accordion.Header className="border-0">{requestId}</Accordion.Header>
        <Accordion.Body className="bg-dark text-light p-0 border-0">
          <Table variant="dark" striped size="sm" className="mb-0">
            <tbody>
              {Object.entries(data)
                .filter(([key]) => !fieldsToIgnore.has(key))
                .map(([key, value]) => {
                  const displayKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, s => s.toUpperCase());
                  return (
                    <tr key={key}>
                      <td><strong>{displayKey}</strong></td>
                      <td>{value.S ?? value.N}</td>
                    </tr>
                  );
                })}
            </tbody>
          </Table>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>

  );
};

export default RequestCard;
