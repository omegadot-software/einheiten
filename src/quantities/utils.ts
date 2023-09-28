/**
 * Tests if a value is a string
 *
 * @param {*} value - Value to test
 *
 * @returns {boolean} true if value is a string, false otherwise
 */
import { isPrefix } from "./definitions";
import type { Kinds } from "./kind";

export function isString(value: any): value is string {
	return typeof value === "string" || value instanceof String;
}

/*
 * Prefer stricter Number.isFinite if currently supported.
 * To be dropped when ES6 is finalized. Obsolete browsers will
 * have to use ES6 polyfills.
 */
/**
 * Tests if a value is a number
 *
 * @param {*} value - Value to test
 *
 * @returns {boolean} true if value is a number, false otherwise
 */
export function isNumber(value: any): value is number {
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	const isFiniteImpl = Number.isFinite || window.isFinite;
	// Number.isFinite allows not to consider NaN or '1' as numbers
	return isFiniteImpl(value);
}

/*
 * Identity function
 */
export function identity(value: number | number[]) {
	return value;
}

/**
 * Returns unique strings from list
 *
 * @param {string[]} strings - array of strings
 *
 *
 * @returns {string[]} a new array of strings without duplicates
 */
export function uniq(strings: Kinds[]): Kinds[] {
	const seen: { [key: string]: boolean } = {};
	return strings.filter((item) => {
		// eslint-disable-next-line no-prototype-builtins
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
}

export function compareArray<T>(array1: T[], array2: T[]): boolean {
	if (array2.length !== array1.length) {
		return false;
	}
	for (let i = 0; i < array1.length; i++) {
		// eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions
		if ((array2[i] as any).compareArray) {
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/strict-boolean-expressions
			if (!(array2[i] as any).compareArray(array1[i])) {
				return false;
			}
		}
		if (array2[i] !== array1[i]) {
			return false;
		}
	}
	return true;
}

/**
 * Safely multiplies numbers while avoiding floating errors
 * like 0.1 * 0.1 => 0.010000000000000002
 *
 * @param {...number} numbers - numbers to multiply
 *
 * @returns {number} result
 */
export function mulSafe(...args: number[]): number {
	let result = 1;
	let decimals = 0;
	for (const arg of args) {
		decimals = decimals + getFractional(arg);
		result *= arg;
	}

	return decimals !== 0 ? round(result, decimals) : result;
}

/**
 * Safely divides two numbers while avoiding floating errors
 * like 0.3 / 0.05 => 5.999999999999999
 *
 * @returns {number} result
 * @param {number} num Numerator
 * @param {number} den Denominator
 */
export function divSafe(num: number, den: number) {
	if (den === 0) {
		throw new Error("Divide by zero");
	}

	const factor = Math.pow(10, getFractional(den));
	const invDen = factor / (factor * den);

	return mulSafe(num, invDen);
}

/**
 * Rounds value at the specified number of decimals
 *
 * @param {number} val - value to round
 * @param {number} decimals - number of decimals
 *
 * @returns {number} rounded number
 */
export function round(val: number, decimals: number) {
	return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function getFractional(num: number) {
	// Check for NaNs or Infinities
	if (!isFinite(num)) {
		return 0;
	}

	// Faster than parsing strings
	// http://jsperf.com/count-decimals/2
	let count = 0;
	while (num % 1 !== 0) {
		num *= 10;
		count++;
	}
	return count;
}

export function findUnitWithPrefixInList(unit: string[], list: string[]) {
	for (let i = 0; i < list.length - unit.length + 1; i++) {
		if (
			compareArray(unit, list.slice(i, i + unit.length)) &&
			(unit.length !== 1 || i === 0 || !isPrefix(list[i - 1])) // prevents interpretating prefix + unit for unit
		) {
			return i;
		}
	}
	return -1;
}
