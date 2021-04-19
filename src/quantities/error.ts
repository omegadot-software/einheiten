/**
 * Custom error type definition
 * @constructor
 */
export default class QtyError extends Error {}

/*
 * Throws incompatible units error
 * @param {string} left - units
 * @param {string} right - units incompatible with first argument
 * @throws "Incompatible units" error
 */
export function throwIncompatibleUnits(left: string, right: string) {
	throw new QtyError(`Incompatible units: ${left} and ${right}`);
}
