import { Accordion } from 'react-bootstrap'
import JsonView from '@uiw/react-json-view';
import type { CompleteRequest } from '../constants/types'
import { vscodeTheme } from '@uiw/react-json-view/vscode';

type RequestCardProps = {
  data: CompleteRequest;
  onHeaderClick: (requestId: string) => void;
};

const RequestCard = ({ data, onHeaderClick }: RequestCardProps) => {
  const requestId = data.SK.S.split('#')[2]

  return (
    <Accordion className="text-light rounded border-0">
      <Accordion.Item eventKey="0" className="border-0">
        <Accordion.Header className="border-0">{requestId}</Accordion.Header>
        <Accordion.Body
          className="bg-dark text-light p-0 border-0"
          onEnter={() => onHeaderClick(requestId)}
        >
          <JsonView 
            value={data} 
            style={{ ...vscodeTheme, overflowX: 'scroll' }}
            displayDataTypes={false}
            collapsed={1}
          />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  )
}

export default RequestCard
