export type Opaque<Type, Name extends string> = Type & { _opaqueName: Name };
