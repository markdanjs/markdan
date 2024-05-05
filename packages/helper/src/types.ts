export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer InferredArrayMember>
    ? DeepPartialArray<InferredArrayMember>
    : T extends object
      ? DeepPartialObject<T>
      : T | undefined

export interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}

export type DeepPartialObject<T> = {
  [Key in keyof T]?: DeepPartial<T[Key]>
}
