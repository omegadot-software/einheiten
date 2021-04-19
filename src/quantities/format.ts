import { assertInstanceof } from "@ts-base/ts-assert/assertInstanceof";

import { isQty, Qty } from "./constructor";
import { OUTPUT_MAP, PREFIX_VALUES, UNITY_ARRAY } from "./definitions";
import { Source, UnitSource } from "./types";
import { compareArray, isNumber, isString, round } from "./utils";

export type Formatter = typeof defaultFormatter;

/**
 * Default formatter
 *
 * @param {number} scalar - scalar value
 * @param {string} units - units as string
 *
 * @returns {string} formatted result
 */
export function defaultFormatter(scalar: number, units: string): string {
	return `${scalar} ${units}`.trim();
}

// returns the 'unit' part of the Unit object without the scalar
export function getUnit(this: Qty): string {
	if (this._units !== undefined) {
		return this._units;
	}

	const numIsUnity = compareArray(this.numerator, UNITY_ARRAY);
	const denIsUnity = compareArray(this.denominator, UNITY_ARRAY);
	if (numIsUnity && denIsUnity) {
		this._units = "";
		return this._units;
	}

	const numUnits = stringifyUnits(this.numerator);
	const denUnits = stringifyUnits(this.denominator);
	this._units = numUnits + (denIsUnity ? "" : `/${denUnits}`);
	return this._units;
}

/**
 * Stringifies the quantity
 * Deprecation notice: only units parameter is supported.
 *
 * @param {(number|string|Qty)} targetUnitsOrMaxDecimalsOrPrec -
 *                              target units if string,
 *                              max number of decimals if number,
 *                              passed to #toPrec before converting if Qty
 *
 * @param {number=} maxDecimals - Maximum number of decimals of
 *                                formatted output
 *
 * @returns {string} reparseable quantity as string
 */
export function toString(this: Qty, maxDecimals?: number): string;
export function toString(this: Qty, precQty: Qty, maxDecimals?: number): string;
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function toString(this: Qty, targetUnits: string, maxDecimals?: number): string;
export function toString(
	this: Qty,
	targetUnitsOrMaxDecimalsOrPrec?: Source,
	maxDecimals?: number
): string {
	let targetUnits: UnitSource;
	if (isNumber(targetUnitsOrMaxDecimalsOrPrec)) {
		targetUnits = this.unit();
		maxDecimals = targetUnitsOrMaxDecimalsOrPrec;
	} else if (isString(targetUnitsOrMaxDecimalsOrPrec)) {
		targetUnits = targetUnitsOrMaxDecimalsOrPrec;
	} else if (isQty(targetUnitsOrMaxDecimalsOrPrec)) {
		assertInstanceof(targetUnitsOrMaxDecimalsOrPrec, Qty);
		return this.toPrec(targetUnitsOrMaxDecimalsOrPrec).toString(maxDecimals);
	} else {
		targetUnits = this;
	}

	const outQty = this.to(targetUnits);

	const outScalar = maxDecimals !== undefined ? round(outQty.scalar, maxDecimals) : outQty.scalar;
	return `${outScalar} ${outQty.unit()}`.trim();
}

/**
 * Format the quantity according to optional passed target units
 * and formatter
 *
 * @param {string} [targetUnits=current units] -
 *                 optional units to convert to before formatting
 *
 * @param {function} [formatter=Qty.formatter] -
 *                   delegates formatting to formatter callback.
 *                   formatter is called back with two parameters (scalar, units)
 *                   and should return formatted result.
 *                   If unspecified, formatting is delegated to default formatter
 *                   set to Qty.formatter
 *
 * @example
 * var roundingAndLocalizingFormatter = function(scalar, units) {
 *   // localize or limit scalar to n max decimals for instance
 *   // return formatted result
 * };
 * var qty = Qty('1.1234 m');
 * qty.format(); // same units, default formatter => "1.234 m"
 * qty.format("cm"); // converted to "cm", default formatter => "123.45 cm"
 * qty.format(roundingAndLocalizingFormatter); // same units, custom formatter => "1,2 m"
 * qty.format("cm", roundingAndLocalizingFormatter); // convert to "cm", custom formatter => "123,4 cm"
 *
 * @returns {string} quantity as string
 */
export function format(this: Qty, targetUnits?: string, formatter?: Formatter): string;
export function format(this: Qty, formatter?: Formatter): string;
export function format(
	this: Qty,
	targetUnitsOrFormatter?: string | Formatter,
	formatter?: Formatter
): string {
	if (typeof targetUnitsOrFormatter === "function") {
		return this.format(undefined, targetUnitsOrFormatter);
	}

	formatter = formatter ?? Qty.formatter;
	const targetQty = this.to(targetUnitsOrFormatter);
	return formatter.call(this, targetQty.scalar, targetQty.unit());
}

/**
 * Returns a string representing a normalized unit array
 *
 * @param {string[]} units Normalized unit array
 * @returns {string} String representing passed normalized unit array and
 *   suitable for output
 *
 */
// TODO Add stringification cache that was removed due to cancerous code
function stringifyUnits(units: string[]) {
	let stringified: string;
	const isUnity = compareArray(units, UNITY_ARRAY);
	if (isUnity) {
		stringified = "1";
	} else {
		stringified = simplify(getOutputNames(units)).join("*");
	}

	return stringified;
}

function getOutputNames(units: string[]) {
	const unitNames = [];
	let token;
	let tokenNext;
	for (let i = 0; i < units.length; i++) {
		token = units[i];
		tokenNext = units[i + 1];
		if (PREFIX_VALUES[token]) {
			unitNames.push(OUTPUT_MAP[token] + OUTPUT_MAP[tokenNext]);
			i++;
		} else {
			unitNames.push(OUTPUT_MAP[token]);
		}
	}
	return unitNames;
}

function simplify(units: string[]) {
	// this turns ['s','m','s'] into ['s2','m']

	const map: { [unit: string]: number } = {};
	const unitCounts = units.reduce((acc, unit) => {
		if (!acc[unit]) {
			acc[unit] = 0;
		}
		acc[unit]++;

		return acc;
	}, map);

	return Object.entries(unitCounts).map(([unit, count]) => {
		return unit + (count > 1 ? String(count) : "");
	});
}
