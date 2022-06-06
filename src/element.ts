export type Element = {
  readonly id: string;
  /** List of element id on which this element is weak over */
  readonly weakOver: string[];
  /** List of element id on which this element is strong over */
  readonly strongOver: string[];
  /** List of element id on which this element is useless over */
  readonly uselessOver: string[];
};

export const getElementStrengthFactorByDefensiveId = (offensiveElement: Element, defensiveId: string) => {
  if (offensiveElement.uselessOver.includes(defensiveId)) return 0;
  if (offensiveElement.weakOver.includes(defensiveId)) return 0.5;
  if (offensiveElement.strongOver.includes(defensiveId)) return 2;
  return 1;
};

export const computeElementsStrengthFactorByDefensiveIds = (offensiveElements: Element[], defensiveElementIds: string[]) => {
  const factorList = offensiveElements.flatMap((element) => defensiveElementIds.map((id) => getElementStrengthFactorByDefensiveId(element, id)));

  return factorList.reduce((factor, value) => factor * value, 1);
};

export const computeElementsStrengthFactor = (offensiveElements: Element[], defensiveElements: Element[]) => {
  const defensiveElementIds = defensiveElements.map(({ id }) => id);
  return computeElementsStrengthFactorByDefensiveIds(offensiveElements, defensiveElementIds);
};
