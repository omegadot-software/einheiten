import { Qty } from "./constructor";
import { PREFIX_VALUES, UNITY, UNITY_ARRAY } from "./definitions";
import QtyError, { throwIncompatibleUnits } from "./error";
import { addTempDegrees, subtractTempDegrees, subtractTemperatures } from "./temperature";
import { UnitSource, Source } from "./types";
import { isNumber, isString, mulSafe, divSafe } from "./utils";

// Returns new instance with units of this
export function add(this: Qty, other: UnitSource): Qty {
	if (isString(other)) {
		other = new Qty(other);
	}

	if (!this.isCompatible(other)) {
		throwIncompatibleUnits(this.unit(), other.unit());
	}

	if (this.isTemperature() && other.isTemperature()) {
		throw new QtyError("Cannot add two temperatures");
	} else if (this.isTemperature()) {
		return addTempDegrees(this, other);
	} else if (other.isTemperature()) {
		return addTempDegrees(other, this);
	}

	return new Qty({
		scalar: this.scalar + other.to(this).scalar,
		numerator: this.numerator,
		denominator: this.denominator,
	});
}

export function sub(this: Qty, other: UnitSource): Qty {
	if (isString(other)) {
		other = new Qty(other);
	}

	if (!this.isCompatible(other)) {
		throwIncompatibleUnits(this.unit(), other.unit());
	}

	if (this.isTemperature() && other.isTemperature()) {
		return subtractTemperatures(this, other);
	} else if (this.isTemperature()) {
		return subtractTempDegrees(this, other);
	} else if (other.isTemperature()) {
		throw new QtyError("Cannot subtract a temperature from a differential degree unit");
	}

	return new Qty({
		scalar: this.scalar - other.to(this).scalar,
		numerator: this.numerator,
		denominator: this.denominator,
	});
}

export function mul(this: Qty, other: Source): Qty {
	if (isNumber(other)) {
		return new Qty({
			scalar: mulSafe(this.scalar, other),
			numerator: this.numerator,
			denominator: this.denominator,
		});
	} else if (isString(other)) {
		other = new Qty(other);
	}

	if (
		(this.isTemperature() || other.isTemperature()) &&
		!(this.isUnitless() || other.isUnitless())
	) {
		throw new QtyError("Cannot multiply by temperatures");
	}

	// Quantities should be multiplied with same units if compatible, with base units else

	// so as not to confuse results, multiplication and division between temperature degrees will maintain original unit info in num/den
	// multiplication and division between deg[CFRK] can never factor each other out, only themselves: "degK*degC/degC^2" == "degK/degC"
	if (this.isCompatible(other) && this.signature !== 400) {
		other = other.to(this);
	}
	const numdenscale = cleanTerms(
		this.numerator,
		this.denominator,
		other.numerator,
		other.denominator
	);

	return new Qty({
		scalar: mulSafe(this.scalar, other.scalar, numdenscale[2]),
		numerator: numdenscale[0],
		denominator: numdenscale[1],
	});
}

export function div(this: Qty, other: Source): Qty {
	if (isNumber(other)) {
		if (other === 0) {
			throw new QtyError("Divide by zero");
		}
		return new Qty({
			scalar: this.scalar / other,
			numerator: this.numerator,
			denominator: this.denominator,
		});
	} else if (isString(other)) {
		other = new Qty(other);
	}

	if (other.scalar === 0) {
		throw new QtyError("Divide by zero");
	}

	if (other.isTemperature()) {
		throw new QtyError("Cannot divide with temperatures");
	} else if (this.isTemperature() && !other.isUnitless()) {
		throw new QtyError("Cannot divide with temperatures");
	}

	// Quantities should be multiplied with same units if compatible, with base units else

	// so as not to confuse results, multiplication and division between temperature degrees will maintain original unit info in num/den
	// multiplication and division between deg[CFRK] can never factor each other out, only themselves: "degK*degC/degC^2" == "degK/degC"
	if (this.isCompatible(other) && this.signature !== 400) {
		other = other.to(this);
	}
	const numdenscale = cleanTerms(
		this.numerator,
		this.denominator,
		other.denominator,
		other.numerator
	);

	return new Qty({
		scalar: mulSafe(this.scalar, numdenscale[2]) / other.scalar,
		numerator: numdenscale[0],
		denominator: numdenscale[1],
	});
}

// Returns a Qty that is the inverse of this Qty,
export function inverse(this: Qty): Qty {
	if (this.isTemperature()) {
		throw new QtyError("Cannot divide with temperatures");
	}
	if (this.scalar === 0) {
		throw new QtyError("Divide by zero");
	}
	return new Qty({
		scalar: 1 / this.scalar,
		numerator: this.denominator,
		denominator: this.numerator,
	});
}

function cleanTerms(
	num1: string[],
	den1: string[],
	num2: string[],
	den2: string[]
): [string[], string[], number] {
	function notUnity(val: string) {
		return val !== UNITY;
	}

	num1 = num1.filter(notUnity);
	num2 = num2.filter(notUnity);
	den1 = den1.filter(notUnity);
	den2 = den2.filter(notUnity);

	const combined: { [key: string]: [-1 | 1, string, string | null, 1, 1] } = {};

	function combineTerms(terms: string[], direction: -1 | 1) {
		let k: string;
		let prefix: string | null;
		let prefixValue: number;
		for (let i = 0; i < terms.length; i++) {
			if (PREFIX_VALUES[terms[i]]) {
				k = terms[i + 1];
				prefix = terms[i];
				prefixValue = PREFIX_VALUES[prefix];
				i++;
			} else {
				k = terms[i];
				prefix = null;
				prefixValue = 1;
			}
			if (k && k !== UNITY) {
				// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
				if (combined[k]) {
					combined[k][0] += direction;
					// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
					const combinedPrefixValue = combined[k][2] ? PREFIX_VALUES[combined[k][2] as string] : 1;
					combined[k][direction === 1 ? 3 : 4] *= divSafe(prefixValue, combinedPrefixValue);
				} else {
					combined[k] = [direction, k, prefix, 1, 1];
				}
			}
		}
	}

	combineTerms(num1, 1);
	combineTerms(den1, -1);
	combineTerms(num2, 1);
	combineTerms(den2, -1);

	let num: (string | string[])[] = [];
	let den: (string | string[])[] = [];
	let scale = 1;

	for (const prop in combined) {
		// eslint-disable-next-line no-prototype-builtins
		if (combined.hasOwnProperty(prop)) {
			const item = combined[prop];
			if (item[0] > 0) {
				for (let n = 0; n < item[0]; n++) {
					num.push(item[2] === null ? item[1] : [item[2], item[1]]);
				}
			} else if (item[0] < 0) {
				for (let n = 0; n < -item[0]; n++) {
					den.push(item[2] === null ? item[1] : [item[2], item[1]]);
				}
			}
			scale *= divSafe(item[3], item[4]);
		}
	}

	if (num.length === 0) {
		num = UNITY_ARRAY;
	}
	if (den.length === 0) {
		den = UNITY_ARRAY;
	}

	// Flatten
	const flatNum = num.reduce((a: string[], b) => {
		return a.concat(b);
	}, []);
	const flatDen = den.reduce((a: string[], b) => {
		return a.concat(b);
	}, []);

	return [flatNum, flatDen, scale];
}
