export async function asyncForEach<T>(
  array: T[],
  callback: (obj: T, ind: number, arr: T[]) => any
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
