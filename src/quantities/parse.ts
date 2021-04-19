import { Qty } from "./constructor";
import { PREFIX_MAP, UNIT_MAP } from "./definitions";
import QtyError from "./error";
import { IScalarAndUnit } from "./types";
import { isString } from "./utils";

const SIGN = "[+-]";
const INTEGER = "\\d+";
const SIGNED_INTEGER = `${SIGN}?${INTEGER}`;
const FRACTION = `\\.${INTEGER}`;
const FLOAT = `(?:${INTEGER}(?:${FRACTION})?` + `)` + `|` + `(?:${FRACTION})`;
const EXPONENT = `[Ee]${SIGNED_INTEGER}`;
const SCI_NUMBER = `(?:${FLOAT})(?:${EXPONENT})?`;
const SIGNED_NUMBER = `${SIGN}?\\s*${SCI_NUMBER}`;
const QTY_STRING = `(${SIGNED_NUMBER})?` + `\\s*([^/]*)(?:/(.+))?`;
const QTY_STRING_REGEX = new RegExp(`^${QTY_STRING}$`);

const POWER_OP = "\\^|\\*{2}";
// Allow unit powers representing scalar, length, area, volume; 4 is for some
// special case representations in SI base units.
const SAFE_POWER = "[01234]";
const TOP_REGEX = new RegExp(`([^ \\*\\d]+?)(?:${POWER_OP})?(-?${SAFE_POWER}(?![a-zA-Z]))`);
const BOTTOM_REGEX = new RegExp(`([^ \\*\\d]+?)(?:${POWER_OP})?(${SAFE_POWER}(?![a-zA-Z]))`);

/* parse a string into a unit object.
 * Typical formats like :
 * "5.6 kg*m/s^2"
 * "5.6 kg*m*s^-2"
 * "5.6 kilogram*meter*second^-2"
 * "2.2 kPa"
 * "37 degC"
 * "1"  -- creates a unitless constant with value 1
 * "GPa"  -- creates a unit with scalar 1 with units 'GPa'
 * 6'4"  -- recognized as 6 feet + 4 inches
 * 8 lbs 8 oz -- recognized as 8 lbs + 8 ounces
 */
export function parse(val: string | number): IScalarAndUnit {
	if (!isString(val)) {
		val = val.toString();
	}
	val = val.trim();

	let result = QTY_STRING_REGEX.exec(val);
	if (!result) {
		throw new QtyError(`${val}: Quantity not recognized`);
	}

	let scalar: number;
	let scalarMatch = result[1];
	if (scalarMatch) {
		// Allow whitespaces between sign and scalar for loose parsing
		scalarMatch = scalarMatch.replace(/\s/g, "");
		scalar = parseFloat(scalarMatch);
	} else {
		scalar = 1;
	}
	let top = result[2];
	let bottom = result[3];

	let n: number;
	let x: string;
	let nx: string;
	// TODO DRY me
	while ((result = TOP_REGEX.exec(top))) {
		n = parseFloat(result[2]);
		if (isNaN(n)) {
			// Prevents infinite loops
			throw new QtyError("Unit exponent is not a number");
		}
		// Disallow unrecognized unit even if exponent is 0
		if (n === 0 && !UNIT_TEST_REGEX.test(result[1])) {
			throw new QtyError("Unit not recognized");
		}
		x = `${result[1]} `;
		nx = "";
		for (let i = 0; i < Math.abs(n); i++) {
			nx += x;
		}
		if (n >= 0) {
			top = top.replace(result[0], nx);
		} else {
			bottom = bottom ? bottom + nx : nx;
			top = top.replace(result[0], "");
		}
	}

	while ((result = BOTTOM_REGEX.exec(bottom))) {
		n = parseFloat(result[2]);
		if (isNaN(n)) {
			// Prevents infinite loops
			throw new QtyError("Unit exponent is not a number");
		}
		// Disallow unrecognized unit even if exponent is 0
		if (n === 0 && !UNIT_TEST_REGEX.test(result[1])) {
			throw new QtyError("Unit not recognized");
		}
		x = `${result[1]} `;
		nx = "";
		for (let j = 0; j < n; j++) {
			nx += x;
		}

		bottom = bottom.replace(result[0], nx);
	}

	let numerator: string[] = [];
	if (top) {
		numerator = parseUnits(top.trim());
	}
	let denominator: string[] = [];
	if (bottom) {
		denominator = parseUnits(bottom.trim());
	}
	return {
		scalar,
		numerator,
		denominator,
	};
}

const PREFIX_REGEX = Object.keys(PREFIX_MAP)
	.sort((a, b) => {
		return b.length - a.length;
	})
	.join("|");
const UNIT_REGEX = Object.keys(UNIT_MAP)
	.sort((a, b) => {
		return b.length - a.length;
	})
	.join("|");
/*
 * Minimal boundary regex to support units with Unicode characters
 * \b only works for ASCII
 */
const BOUNDARY_REGEX = "\\b|$";
const UNIT_MATCH = `(${PREFIX_REGEX})??(${UNIT_REGEX})(?:${BOUNDARY_REGEX})`;
const UNIT_TEST_REGEX = new RegExp(`^\\s*(${UNIT_MATCH}[\\s\\*]*)+$`);
const UNIT_MATCH_REGEX = new RegExp(UNIT_MATCH, "g"); // g flag for multiple occurences
const parsedUnitsCache: { [key: string]: string[] } = {};
/**
 * Parses and converts units string to normalized unit array.
 * Result is cached to speed up next calls.
 *
 * @param {string} units Units string
 * @returns {string[]} Array of normalized units
 *
 * @example
 * // Returns ["<second>", "<meter>", "<second>"]
 * parseUnits("s m s");
 *
 */
function parseUnits(units: string) {
	const cached = parsedUnitsCache[units];
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (cached) {
		return cached;
	}

	let unitMatch;
	let normalizedUnits = [];

	// Scan
	if (!UNIT_TEST_REGEX.test(units)) {
		throw new QtyError("Unit not recognized");
	}

	while ((unitMatch = UNIT_MATCH_REGEX.exec(units))) {
		normalizedUnits.push(unitMatch.slice(1));
	}

	normalizedUnits = normalizedUnits.map((item) => {
		return PREFIX_MAP[item[0]] ? [PREFIX_MAP[item[0]], UNIT_MAP[item[1]]] : [UNIT_MAP[item[1]]];
	});

	// Flatten and remove null elements
	normalizedUnits = normalizedUnits.reduce((a, b) => {
		return a.concat(b);
	}, []);
	normalizedUnits = normalizedUnits.filter((item) => {
		return item;
	});

	parsedUnitsCache[units] = normalizedUnits;

	return normalizedUnits;
}

/**
 * Parses a string as a quantity
 * @param {string} value - quantity as text
 * @throws if value is not a string
 * @returns {Qty|null} Parsed quantity or null if unrecognized
 */
export function globalParse(value: string): Qty | null {
	if (!isString(value)) {
		throw new QtyError("Argument should be a string");
	}

	try {
		return new Qty(value);
	} catch (e) {
		return null;
	}
}
