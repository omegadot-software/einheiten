import { Qty } from "./constructor";
import { throwIncompatibleUnits } from "./error";
import { UnitSource } from "./types";
import { isString } from "./utils";

export function eq(this: Qty, other: UnitSource) {
	return this.compareTo(other) === 0;
}

export function lt(this: Qty, other: UnitSource) {
	return this.compareTo(other) === -1;
}

export function lte(this: Qty, other: UnitSource) {
	return this.eq(other) || this.lt(other);
}

export function gt(this: Qty, other: UnitSource) {
	return this.compareTo(other) === 1;
}

export function gte(this: Qty, other: UnitSource) {
	return this.eq(other) || this.gt(other);
}

// Compare two Qty objects. Throws an exception if they are not of compatible types.
// Comparisons are done based on the value of the quantity in base SI units.
//
// NOTE: We cannot compare inverses as that breaks the general compareTo contract:
//   if a.compareTo(b) < 0 then b.compareTo(a) > 0
//   if a.compareTo(b) == 0 then b.compareTo(a) == 0
//
//   Since "10S" == ".1ohm" (10 > .1) and "10ohm" == ".1S" (10 > .1)
//     Qty("10S").inverse().compareTo("10ohm") == -1
//     Qty("10ohm").inverse().compareTo("10S") == -1
//
//   If including inverses in the sort is needed, I suggest writing: Qty.sort(qtyArray,units)
export function compareTo(this: Qty, other: UnitSource): -1 | 0 | 1 {
	if (isString(other)) {
		return this.compareTo(new Qty(other));
	}
	if (!this.isCompatible(other)) {
		throwIncompatibleUnits(this.unit(), other.unit());
	}
	if (this.baseScalar < other.baseScalar) {
		return -1;
	} else if (this.baseScalar === other.baseScalar) {
		return 0;
	} else if (this.baseScalar > other.baseScalar) {
		return 1;
	}
	throw new Error("Unreachable");
}

// Return true if quantities and units match
// Unit("100 cm").same(Unit("100 cm"))  # => true
// Unit("100 cm").same(Unit("1 m"))     # => false
export function same(this: Qty, other: Qty): boolean {
	return this.scalar === other.scalar && this.unit() === other.unit();
}
