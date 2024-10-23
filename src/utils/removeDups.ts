interface Item {
  id: unknown;
}

export default function removeDuplicates<T extends Item>(arr: T[]) {
  const ids = new Set<string>();

  return arr.filter(({ id }) => !ids.has(`${id}`) && ids.add(`${id}`));
}
