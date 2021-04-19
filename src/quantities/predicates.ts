import { Qty, isQty } from "./constructor";
import { BASE_UNITS, UNITY, UNITY_ARRAY } from "./definitions";
import { UnitSource } from "./types";
import { compareArray, isString } from "./utils";

// returns true if no associated units
// false, even if the units are "unitless" like 'radians, each, etc'
export function isUnitless(this: Qty): boolean {
	return [this.numerator, this.denominator].every((item) => compareArray(item, UNITY_ARRAY));
}

/*
check to see if units are compatible, but not the scalar part
this check is done by comparing signatures for performance reasons
if passed a string, it will create a unit object with the string and then do the comparison
this permits a syntax like:
unit =~ "mm"
if you want to do a regexp on the unit string do this ...
unit.units =~ /regexp/
*/
export function isCompatible(this: Qty, other: UnitSource): boolean {
	if (isString(other)) {
		return this.isCompatible(new Qty(other));
	}

	if (!isQty(other)) {
		return false;
	}

	if (other.signature !== undefined) {
		return this.signature === other.signature;
	} else {
		return false;
	}
}

/*
check to see if units are inverse of each other, but not the scalar part
this check is done by comparing signatures for performance reasons
if passed a string, it will create a unit object with the string and then do the comparison
this permits a syntax like:
unit =~ "mm"
if you want to do a regexp on the unit string do this ...
unit.units =~ /regexp/
*/
export function isInverse(this: Qty, other: Qty) {
	return this.inverse().isCompatible(other);
}

// Returns 'true' if the Unit is represented in base units
export function isBase(this: Qty): boolean {
	if (this._isBase !== undefined) {
		return this._isBase;
	}
	if (this.isDegrees() && /<(kelvin|temp-K)>/.exec(this.numerator[0])) {
		this._isBase = true;
		return this._isBase;
	}

	this.numerator.concat(this.denominator).forEach((item) => {
		if (item !== UNITY && BASE_UNITS.indexOf(item) === -1) {
			this._isBase = false;
		}
	}, this);
	if (this._isBase === false) {
		return this._isBase;
	}
	this._isBase = true;
	return this._isBase;
}
