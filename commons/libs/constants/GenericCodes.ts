// TODO: add  error categories and codes as necessary with further development. remove this comment when the all the codes needed for application are mostly covered
export const GenericCodes = {
  unauthorized: 401,
  notFound: 404
}

export const HttpCodes = {
  ...GenericCodes,
  ok: 200,
  created: 201,
  noContent: 204
}
