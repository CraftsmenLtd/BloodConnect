import { Card, Form } from 'react-bootstrap';

type InfoCardProps = {
  data: string;
  onDataChange?: (arg:string) => void;
}

const InfoCard = ({
  data,
  onDataChange
}: InfoCardProps) => {
  return (
    <Card style={{ 
      width: '18rem', zIndex: 1, margin: '4px', position: 'relative' }} bg='success'>
      <Card.Body>
        <Card.Text>
          <Form.Control
            type="text"
            aria-describedby="enter data"
            value={data}
            onChange={(e) => { onDataChange?.(e.target.value) }}
          />
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default InfoCard;
