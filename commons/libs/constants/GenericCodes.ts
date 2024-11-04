// TODO: add  error categories and codes as necessary with further development. remove this comment when the all the codes needed for application are mostly covered
export const GENERIC_CODES = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  ERROR: 500,
  TOO_MANY_REQUESTS: 429
}

export const HTTP_CODES = {
  ...GENERIC_CODES,
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204
}
