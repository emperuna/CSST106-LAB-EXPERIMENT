/** Odd kernel sizes as select options, labelled "3 x 3". */
export const kernelSizes = (values: number[]) =>
  values.map((value) => ({ value, label: `${value} x ${value}` }));
