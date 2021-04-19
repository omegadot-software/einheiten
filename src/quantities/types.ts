import { Qty } from "..";

export interface IRegularObject<T> {
	[key: string]: T;
}

export interface IScalarAndUnit {
	scalar: number;
	numerator: string[];
	denominator: string[];
}

export type UnitSource = Qty | string;
export type Source = UnitSource | number;

export type UnitDefinition = [string[], number, string, string[]?, string[]?];
