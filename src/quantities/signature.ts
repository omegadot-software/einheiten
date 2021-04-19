import { Qty } from "./constructor";
import { UNITS } from "./definitions";
import { UnitDefinition } from "./types";

const SIGNATURE_VECTOR = [
	"length",
	"time",
	"temperature",
	"mass",
	"current",
	"substance",
	"luminosity",
	"currency",
	"information",
	"angle",
];

/*
calculates the unit signature id for use in comparing compatible units and simplification
the signature is based on a simple classification of units and is based on the following publication

Novak, G.S., Jr. "Conversion of units of measurement", IEEE Transactions on Software Engineering,
21(8), Aug 1995, pp.651-661
doi://10.1109/32.403789
http://ieeexplore.ieee.org/Xplore/login.jsp?url=/iel1/32/9079/00403789.pdf?isnumber=9079&prod=JNL&arnumber=403789&arSt=651&ared=661&arAuthor=Novak%2C+G.S.%2C+Jr.
*/
export function unitSignature(qty: Qty): number {
	if (qty.signature) {
		return qty.signature;
	}
	const vector = unitSignatureVector(qty);
	for (let i = 0; i < vector.length; i++) {
		vector[i] *= Math.pow(20, i);
	}

	return vector.reduce((previous, current) => previous + current, 0);
}

// calculates the unit signature vector used by unit_signature
function unitSignatureVector(qty: Qty): number[] {
	if (!qty.isBase()) {
		return unitSignatureVector(qty.toBase());
	}

	const vector = new Array<number>(SIGNATURE_VECTOR.length);
	for (let i = 0; i < vector.length; i++) {
		vector[i] = 0;
	}
	let r: UnitDefinition;
	let n: number;
	for (const numeratorUnit of qty.numerator) {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if ((r = UNITS[numeratorUnit])) {
			n = SIGNATURE_VECTOR.indexOf(r[2]);
			if (n >= 0) {
				vector[n] = vector[n] + 1;
			}
		}
	}

	for (const denominatorUnit of qty.denominator) {
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if ((r = UNITS[denominatorUnit])) {
			n = SIGNATURE_VECTOR.indexOf(r[2]);
			if (n >= 0) {
				vector[n] = vector[n] - 1;
			}
		}
	}
	return vector;
}
