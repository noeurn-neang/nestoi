import { joiToJson } from '../index';

export function propertiesToJson(properties: any) {
  let joi: Record<string, any> = {};

  for (let key in properties) {
    joi[key] = joiToJson(properties[key]);
  }
  return joi;
}
