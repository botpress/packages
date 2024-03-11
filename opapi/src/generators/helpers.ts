export const typeHelpers = `
type SimplifyOptions = { deep?:boolean }

type Flatten<
	AnyType,
	Options extends SimplifyOptions = {},
> = Options['deep'] extends true
	? {[KeyType in keyof AnyType]: Simplify<AnyType[KeyType], Options>}
	: {[KeyType in keyof AnyType]: AnyType[KeyType]};

type Simplify<
	AnyType,
	Options extends SimplifyOptions = {},
> = Flatten<AnyType> extends AnyType
	? Flatten<AnyType, Options>
	: AnyType;

type Merge_<FirstType, SecondType> = Except<FirstType, Extract<keyof FirstType, keyof SecondType>> & SecondType;

type IsEqual<T, U> =
	(<G>() => G extends T ? 1 : 2) extends
	(<G>() => G extends U ? 1 : 2)
		? true
		: false;

type Filter<KeyType, ExcludeType> = IsEqual<KeyType, ExcludeType> extends true ? never : (KeyType extends ExcludeType ? never : KeyType);


type Merge<FirstType, SecondType> = Simplify<Merge_<FirstType, SecondType>>;

type Except<ObjectType, KeysType extends keyof ObjectType> = {
	[KeyType in keyof ObjectType as Filter<KeyType, KeysType>]: ObjectType[KeyType];
};`
