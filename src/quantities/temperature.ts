import { Qty } from "./constructor";
import { UNITY_ARRAY } from "./definitions";
import QtyError from "./error";
import { compareArray } from "./utils";

export function isDegrees(this: Qty): boolean {
	// signature may not have been calculated yet
	return (
		(!this.signature || this.signature === 400) &&
		this.numerator.length === 1 &&
		compareArray(this.denominator, UNITY_ARRAY) &&
		(!!/<temp-[CFRK]>/.exec(this.numerator[0]) ||
			!!/<(kelvin|celsius|rankine|fahrenheit)>/.exec(this.numerator[0]))
	);
}

export function isTemperature(this: Qty): boolean {
	return this.isDegrees() && !!/<temp-[CFRK]>/.exec(this.numerator[0]);
}

export function subtractTemperatures(lhs: Qty, rhs: Qty) {
	const lhsUnits = lhs.unit();
	const rhsConverted = rhs.to(lhsUnits);
	const dstDegrees = new Qty(getDegreeUnits(lhsUnits));
	return new Qty({
		scalar: lhs.scalar - rhsConverted.scalar,
		numerator: dstDegrees.numerator,
		denominator: dstDegrees.denominator,
	});
}

export function subtractTempDegrees(temp: Qty, deg: Qty) {
	const tempDegrees = deg.to(getDegreeUnits(temp.unit()));
	return new Qty({
		scalar: temp.scalar - tempDegrees.scalar,
		numerator: temp.numerator,
		denominator: temp.denominator,
	});
}

export function addTempDegrees(temp: Qty, deg: Qty) {
	const tempDegrees = deg.to(getDegreeUnits(temp.unit()));
	return new Qty({
		scalar: temp.scalar + tempDegrees.scalar,
		numerator: temp.numerator,
		denominator: temp.denominator,
	});
}

function getDegreeUnits(units: string) {
	if (units === "tempK") {
		return "degK";
	} else if (units === "tempC") {
		return "degC";
	} else if (units === "tempF") {
		return "degF";
	} else if (units === "tempR") {
		return "degR";
	} else {
		throw new QtyError(`Unknown type for temp conversion from: ${units}`);
	}
}

export function toDegrees(src: Qty, dst: Qty) {
	const srcDegK = toDegK(src);
	const dstUnits = dst.unit();
	let dstScalar;

	if (dstUnits === "K") {
		dstScalar = srcDegK.scalar;
	} else if (dstUnits === "°C") {
		dstScalar = srcDegK.scalar;
	} else if (dstUnits === "°F") {
		dstScalar = (srcDegK.scalar * 9) / 5;
	} else if (dstUnits === "°R") {
		dstScalar = (srcDegK.scalar * 9) / 5;
	} else {
		throw new QtyError(`Unknown type for degree conversion to: ${dstUnits}`);
	}

	return new Qty({
		scalar: dstScalar,
		numerator: dst.numerator,
		denominator: dst.denominator,
	});
}

function toDegK(qty: Qty) {
	const units = qty.unit();
	let q;
	if (/((deg)[CFRK])|(°[CF])|K/.exec(units)) {
		q = qty.baseScalar;
	} else if (units === "tempK") {
		q = qty.scalar;
	} else if (units === "tempC") {
		q = qty.scalar;
	} else if (units === "tempF") {
		q = (qty.scalar * 5) / 9;
	} else if (units === "tempR") {
		q = (qty.scalar * 5) / 9;
	} else {
		throw new QtyError(`Unknown type for temp conversion from: ${units}`);
	}

	return new Qty({
		scalar: q,
		numerator: ["<kelvin>"],
		denominator: UNITY_ARRAY,
	});
}

export function toTemp(src: Qty, dst: Qty) {
	const dstUnits = dst.unit();
	let dstScalar;

	if (dstUnits === "tempK") {
		dstScalar = src.baseScalar;
	} else if (dstUnits === "tempC") {
		dstScalar = src.baseScalar - 273.15;
	} else if (dstUnits === "tempF") {
		dstScalar = (src.baseScalar * 9) / 5 - 459.67;
	} else if (dstUnits === "tempR") {
		dstScalar = (src.baseScalar * 9) / 5;
	} else {
		throw new QtyError(`Unknown type for temp conversion to: ${dstUnits}`);
	}

	return new Qty({
		scalar: dstScalar,
		numerator: dst.numerator,
		denominator: dst.denominator,
	});
}

export function toTempK(qty: Qty) {
	const units = qty.unit();
	let q;
	if (/(deg)[CFRK]/.exec(units)) {
		q = qty.baseScalar;
	} else if (units === "tempK") {
		q = qty.scalar;
	} else if (units === "tempC") {
		q = qty.scalar + 273.15;
	} else if (units === "tempF") {
		q = ((qty.scalar + 459.67) * 5) / 9;
	} else if (units === "tempR") {
		q = (qty.scalar * 5) / 9;
	} else {
		throw new QtyError(`Unknown type for temp conversion from: ${units}`);
	}

	return new Qty({
		scalar: q,
		numerator: ["<temp-K>"],
		denominator: UNITY_ARRAY,
	});
}
