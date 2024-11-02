import removeDuplicates from './removeDups';

describe('removeDuplicates', () => {
  it('should return an empty array if an empty array is provided', () => {
    expect(removeDuplicates([])).toEqual([]);
  });

  it('should return all the elements if no one has a duplicated id', () => {
    const items = [{ id: 1 }, { id: 2 }];
    expect(removeDuplicates(items)).toEqual(items);
  });

  it('should return only items with different id', () => {
    const items = [
      { id: 1 },
      { id: 2 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 2 },
      { id: 1 },
      { id: 5 }
    ];

    const ret = removeDuplicates(items);

    expect(ret).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
  });
});
