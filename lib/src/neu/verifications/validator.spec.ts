import { floatType, Type } from "../types";
import { Validator } from './validator';

describe("validators", () => {
let validator: Validator;
  beforeAll(() => {
    validator = new Validator();
  });

  test("should return an error when primitive type is incorrect", () => {
    const result = validator.run({ name: 'param', value: 'notANumber' }, floatType());
    expect(result).toBe(false);
    expect(validator.messages[0]).toEqual('"param" should be float')
  })
});