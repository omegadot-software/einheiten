import { compareTo, eq, gt, gte, lt, lte, same } from "./comparators";
import { to, toBase, toPrec, toFloat, convertSingleUnit, swiftConverter } from "./conversion";
import { getAliases, getUnits, UNITY_ARRAY } from "./definitions";
import QtyError from "./error";
import { defaultFormatter, format, getUnit, toString } from "./format";
import { getKinds, kind } from "./kind";
import { add, sub, inverse, div, mul } from "./operators";
import { globalParse } from "./parse";
import { parse } from "./parse";
import { isBase, isCompatible, isInverse, isUnitless } from "./predicates";
import { unitSignature } from "./signature";
import { isTemperature } from "./temperature";
import { isDegrees } from "./temperature";
import { IRegularObject, IScalarAndUnit } from "./types";
import { compareArray, divSafe, isString, isNumber, mulSafe } from "./utils";

/**
 * Tests if a value is a Qty instance
 *
 * @param {*} value - Value to test
 *
 * @returns {boolean} true if value is a Qty instance, false otherwise
 */
export function isQty(value: Qty | IScalarAndUnit | number | string | undefined) {
	return value instanceof Qty;
}

export class Qty {
	readonly numerator: string[] = UNITY_ARRAY;
	readonly denominator: string[] = UNITY_ARRAY;
	readonly scalar: number;
	readonly baseScalar: number;
	readonly init: IScalarAndUnit | Qty | number | string;
	readonly signature: number;

	protected _conversionCache: IRegularObject<Qty> = {};
	protected _units?: string;
	protected _isBase?: boolean;

	constructor(other: Qty);
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	constructor(initValue: IScalarAndUnit);
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	constructor(scalarAndUnit: string);
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	constructor(scalar: number, unit: string);
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	constructor(scalar: number);
	constructor(value: IScalarAndUnit | Qty | number | string, unit?: string) {
		assertValidConstructorArgs(value, unit);

		let initValue: IScalarAndUnit;
		if (typeof value === "number" || typeof value === "string") {
			if (unit) {
				initValue = parse(unit);
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				initValue.scalar = value as number;
			} else {
				initValue = parse(value);
			}
		} else {
			if (!isDefinitionObject(value)) throw new Error("Invalid input");
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			initValue = value as IScalarAndUnit;
		}

		this.scalar = initValue.scalar;
		this.numerator =
			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			initValue.numerator && initValue.numerator.length !== 0 ? initValue.numerator : UNITY_ARRAY;
		this.denominator =
			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			initValue.denominator && initValue.denominator.length !== 0
				? initValue.denominator
				: UNITY_ARRAY;

		// math with temperatures is very limited
		if (this.denominator.join("*").indexOf("temp") >= 0) {
			throw new QtyError("Cannot divide with temperatures");
		}
		if (this.numerator.join("*").indexOf("temp") >= 0) {
			if (this.numerator.length > 1) {
				throw new QtyError("Cannot multiply by temperatures");
			}
			if (!compareArray(this.denominator, UNITY_ARRAY)) {
				throw new QtyError("Cannot divide with temperatures");
			}
		}

		this.init = value;

		if (this.isBase()) {
			this.baseScalar = this.scalar;
			this.signature = unitSignature(this);
		} else {
			const base = this.toBase();
			this.baseScalar = base.scalar;
			this.signature = base.signature;
		}

		if (this.isTemperature() && this.baseScalar < 0) {
			throw new QtyError("Temperatures must not be less than absolute zero");
		}
	}

	// Member functions declared in other files

	eq = eq;
	lt = lt;
	lte = lte;
	gt = gt;
	gte = gte;
	compareTo = compareTo;
	same = same;

	to = to;
	toBase = toBase;
	toFloat = toFloat;
	toPrec = toPrec;
	convertSingleUnit = convertSingleUnit;

	isDegrees = isDegrees;
	isTemperature = isTemperature;

	isUnitless = isUnitless;
	isBase = isBase;
	isInverse = isInverse;
	isCompatible = isCompatible;

	add = add;
	sub = sub;
	mul = mul;
	div = div;
	inverse = inverse;

	unit = getUnit;
	toString = toString;
	format = format;

	kind = kind;

	// Global API as static functions

	static getKinds = getKinds;
	static getAliases = getAliases;
	static getUnits = getUnits;
	static parse = globalParse;
	static mulSafe = mulSafe;
	static divSafe = divSafe;
	static swiftConverter = swiftConverter;
	static Error = QtyError;
	static formatter = defaultFormatter;
}

/**
 * Asserts constructor arguments are valid
 *
 * @param {*} value - Value to test
 * @param {string} [units] - Optional units when value is passed as a number
 *
 * @returns {void}
 * @throws {QtyError} if constructor arguments are invalid
 */
function assertValidConstructorArgs(value: IScalarAndUnit | Qty | number | string, units?: string) {
	if (units) {
		if (!(isNumber(value) && isString(units))) {
			throw new QtyError(
				"Only number accepted as initialization value " + "when units are explicitly provided"
			);
		}
	} else {
		if (!(isString(value) || isNumber(value) || isQty(value) || isDefinitionObject(value))) {
			throw new QtyError(
				"Only string, number or quantity accepted as " + "single initialization value"
			);
		}
	}
}

/**
 * Tests if a value is a Qty definition object
 *
 * @param {*} value - Value to test
 *
 * @returns {boolean} true if value is a definition object, false otherwise
 */
function isDefinitionObject(value: unknown): boolean {
	// eslint-disable-next-line no-prototype-builtins,@typescript-eslint/strict-boolean-expressions
	return !!(value && typeof value === "object" && value.hasOwnProperty("scalar"));
}
