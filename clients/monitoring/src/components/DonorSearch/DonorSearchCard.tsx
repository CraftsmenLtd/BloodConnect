import { Accordion, Badge } from 'react-bootstrap'
import JsonView from '@uiw/react-json-view'
import { vscodeTheme } from '@uiw/react-json-view/vscode'
import type { DonorSearchDynamoDBUnmarshaledItem } from '../../constants/types'

const DonorSearchCard = ({ data }: { data: DonorSearchDynamoDBUnmarshaledItem }) => {
  const requestId = data.SK.S.split('#')[2]
  const found = data.donorsFoundSoFar?.N ?? '0'
  const target = data.targetDonors?.N ?? '?'

  return (
    <Accordion className="text-light rounded border-0">
      <Accordion.Item eventKey="0" className="border-0">
        <Accordion.Header className="border-0">
          <Badge bg="dark" className="me-2">{requestId}</Badge>
          <small>
            {found}/{target} donors · lvl {data.currentLevel?.N ?? '0'} · retry {data.currentRetryCount?.N ?? '0'}
          </small>
        </Accordion.Header>
        <Accordion.Body className="bg-dark text-light p-0 border-0">
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

export default DonorSearchCard
