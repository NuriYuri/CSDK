import { computeStat, Creature, registerComputeStatFunction } from './creature';

describe('creature', () => {
  describe('registerComputeStatFunction - computeStat', () => {
    it('returns 1 if no function has been registered', () => {
      expect(computeStat(undefined as unknown as Creature<unknown>, undefined as unknown as string)).toEqual(1);
    });

    it('calls the registered function', () => {
      const registeredFunction = jest.fn();
      registeredFunction.mockReturnValueOnce(58);
      registerComputeStatFunction(registeredFunction);

      expect(computeStat(55 as unknown as Creature<unknown>, '32')).toEqual(58);
      expect(registeredFunction).toHaveBeenCalledTimes(1);
      expect(registeredFunction).toHaveBeenCalledWith(55, '32');
    });
  });
});
