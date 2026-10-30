// Valida req[source] com zod e guarda o resultado já coagido em req.valid[source].
export const validate = (schema, source = 'query') => (req, _res, next) => {
  try {
    req.valid = { ...(req.valid || {}), [source]: schema.parse(req[source]) };
    next();
  } catch (e) {
    next(e);
  }
};
