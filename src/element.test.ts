import {
  computeElementsStrengthFactor,
  computeElementsStrengthFactorByDefensiveIds,
  Element,
  getElementStrengthFactorByDefensiveId,
} from './element';

describe('element', () => {
  describe('getElementStrengthFactorByDefensiveId', () => {
    it('returns 1 if the element is in none of the weakOver, strongOver or uselessOver arrays', () => {
      const offensiveElement: Element = { id: 'test', weakOver: ['test2'], strongOver: ['test3'], uselessOver: ['test4'] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement, 'test5')).toEqual(1);
    });

    it('returns 0 if the defensive element is immune to the offensive element', () => {
      const offensiveElement: Element = { id: 'test', weakOver: [], strongOver: [], uselessOver: ['test2'] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement, 'test2')).toEqual(0);

      const offensiveElement2: Element = { id: 'test', weakOver: [], strongOver: [], uselessOver: ['test2', 'test3', 'test4'] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement2, 'test3')).toEqual(0);
    });

    it('returns 0 if the defensive element is immune but also exists in strongOver or weakOver', () => {
      const offensiveElement: Element = { id: 'test', weakOver: [], strongOver: ['test2'], uselessOver: ['test2'] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement, 'test2')).toEqual(0);

      const offensiveElement2: Element = { id: 'test', weakOver: ['test2'], strongOver: [], uselessOver: ['test2'] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement2, 'test2')).toEqual(0);

      const offensiveElement3: Element = { id: 'test', weakOver: ['test2'], strongOver: ['test2'], uselessOver: ['test2'] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement3, 'test2')).toEqual(0);
    });

    it('returns 0.5 if the offensive element is weak over the defensive element', () => {
      const offensiveElement: Element = { id: 'test', weakOver: ['test2'], strongOver: [], uselessOver: [] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement, 'test2')).toEqual(0.5);

      const offensiveElement2: Element = { id: 'test', weakOver: ['test2', 'test3', 'test4'], strongOver: [], uselessOver: [] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement2, 'test3')).toEqual(0.5);
    });

    it('returns 0.5 if the offensive element is weak over the defensive element even if defensive exists in strongOver', () => {
      const offensiveElement: Element = { id: 'test', weakOver: ['test2'], strongOver: ['test2'], uselessOver: [] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement, 'test2')).toEqual(0.5);
    });

    it('returns 2 if the offensive element is strong over the defensive element', () => {
      const offensiveElement: Element = { id: 'test', weakOver: [], strongOver: ['test2'], uselessOver: [] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement, 'test2')).toEqual(2);

      const offensiveElement2: Element = { id: 'test', weakOver: [], strongOver: ['test2', 'test3', 'test4'], uselessOver: [] };
      expect(getElementStrengthFactorByDefensiveId(offensiveElement2, 'test3')).toEqual(2);
    });
  });

  describe('computeElementsStrengthFactorByDefensiveIds', () => {
    it('computes the final factor taking in account all strengths/weaknesses', () => {
      const offensiveElements: Element[] = [
        { id: 'test1', weakOver: ['test1'], strongOver: ['test2'], uselessOver: [] },
        { id: 'test2', weakOver: [], strongOver: ['test1', 'test3'], uselessOver: [] },
      ];

      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test1', 'test2'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test3', 'test2'])).toEqual(4);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test1'])).toEqual(1);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test1'])).toEqual(0.5);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test2'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test3'])).toEqual(1);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test1', 'test2'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test3', 'test2'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test1'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test2'])).toEqual(1);
    });

    it('returns 0 if a type defensive type is immune to any of the offensive type', () => {
      const offensiveElements: Element[] = [
        { id: 'test1', weakOver: ['test1'], strongOver: ['test2'], uselessOver: ['test5'] },
        { id: 'test2', weakOver: [], strongOver: ['test1', 'test3'], uselessOver: ['test4'] },
      ];

      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test1', 'test2', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test1', 'test2', 'test5'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test3', 'test2', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test3', 'test2', 'test5'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test1', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds(offensiveElements, ['test1', 'test5'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test1', 'test4'])).toEqual(0.5);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test1', 'test5'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test2', 'test4'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test2', 'test5'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test3', 'test4'])).toEqual(1);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[0]], ['test3', 'test5'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test1', 'test2', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test1', 'test2', 'test5'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test3', 'test2', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test3', 'test2', 'test5'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test1', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test1', 'test5'])).toEqual(2);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test2', 'test4'])).toEqual(0);
      expect(computeElementsStrengthFactorByDefensiveIds([offensiveElements[1]], ['test2', 'test5'])).toEqual(1);
    });
  });

  describe('computeElementsStrengthFactor', () => {
    const test3: Element = { id: 'test3', weakOver: [], strongOver: [], uselessOver: [] };
    const test4: Element = { id: 'test4', weakOver: [], strongOver: [], uselessOver: [] };
    const test5: Element = { id: 'test5', weakOver: [], strongOver: [], uselessOver: [] };

    it('computes the final factor taking in account all strengths/weaknesses', () => {
      const test1: Element = { id: 'test1', weakOver: ['test1'], strongOver: ['test2'], uselessOver: [] };
      const test2: Element = { id: 'test2', weakOver: [], strongOver: ['test1', 'test3'], uselessOver: [] };
      const offensiveElements = [test1, test2];

      expect(computeElementsStrengthFactor(offensiveElements, [test1, test2])).toEqual(2);
      expect(computeElementsStrengthFactor(offensiveElements, [test3, test2])).toEqual(4);
      expect(computeElementsStrengthFactor(offensiveElements, [test1])).toEqual(1);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test1])).toEqual(0.5);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test2])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test3])).toEqual(1);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test1, test2])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test3, test2])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test1])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test2])).toEqual(1);
    });

    it('returns 0 if a type defensive type is immune to any of the offensive type', () => {
      const test1: Element = { id: 'test1', weakOver: ['test1'], strongOver: ['test2'], uselessOver: ['test5'] };
      const test2: Element = { id: 'test2', weakOver: [], strongOver: ['test1', 'test3'], uselessOver: ['test4'] };
      const offensiveElements = [test1, test2];

      expect(computeElementsStrengthFactor(offensiveElements, [test1, test2, test4])).toEqual(0);
      expect(computeElementsStrengthFactor(offensiveElements, [test1, test2, test5])).toEqual(0);
      expect(computeElementsStrengthFactor(offensiveElements, [test3, test2, test4])).toEqual(0);
      expect(computeElementsStrengthFactor(offensiveElements, [test3, test2, test5])).toEqual(0);
      expect(computeElementsStrengthFactor(offensiveElements, [test1, test4])).toEqual(0);
      expect(computeElementsStrengthFactor(offensiveElements, [test1, test5])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test1, test4])).toEqual(0.5);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test1, test5])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test2, test4])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test2, test5])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test3, test4])).toEqual(1);
      expect(computeElementsStrengthFactor([offensiveElements[0]], [test3, test5])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test1, test2, test4])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test1, test2, test5])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test3, test2, test4])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test3, test2, test5])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test1, test4])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test1, test5])).toEqual(2);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test2, test4])).toEqual(0);
      expect(computeElementsStrengthFactor([offensiveElements[1]], [test2, test5])).toEqual(1);
    });
  });
});
