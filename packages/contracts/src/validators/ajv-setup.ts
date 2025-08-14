import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export function createAjvInstance(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
    strict: true
  });

  addFormats(ajv);
  
  return ajv;
}