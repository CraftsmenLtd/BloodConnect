async function donorRequestRouter(): Promise<any> {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Message successfully added to retry queue'
    })
  }
}

export default donorRequestRouter
