import { readFile as readFileFs } from "fs";
import { resolve } from "path";
import { promisify } from "util";

import { Qty } from "../index";

const readFile = promisify(readFileFs);

function readUTF8File(...paths: string[]): Promise<string> {
	return readFile(resolve(...paths), "utf8");
}

function readJSONFile(...paths: string[]): Promise<any> {
	return readUTF8File(...paths).then((fileContents) => JSON.parse(fileContents));
}

// Big list of naughty strings
let blns: string[];

beforeAll(async () => {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	blns = (await readJSONFile(__dirname, "./blns.json")) as string[];
});

describe("js-quantities", function () {
	describe("initialization", function () {
		it("should create unit only", function () {
			const qty = new Qty("m");
			expect(qty.numerator).toEqual(["<meter>"]);
			expect(qty.scalar).toBe(1);
		});

		it("should create unitless", function () {
			let qty = new Qty("1");
			expect(qty.toFloat()).toBe(1);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<1>"]);
			qty = new Qty("1.5");
			expect(qty.toFloat()).toBe(1.5);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("should create unitless from numbers", function () {
			const qty = new Qty(1.5);
			expect(qty.toFloat()).toBe(1.5);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("should create from numbers with explicit units", function () {
			const qty = new Qty(1.5, "m");
			expect(qty.scalar).toBe(1.5);
			expect(qty.numerator).toEqual(["<meter>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("temperatures should have base unit in kelvin", function () {
			let qty = new Qty("1 tempK").toBase();
			expect(qty.scalar).toBe(1);
			expect(qty.unit()).toBe("tempK");

			qty = new Qty("1 tempR").toBase();
			expect(qty.scalar).toBe(5 / 9);
			expect(qty.unit()).toBe("tempK");

			qty = new Qty("0 tempC").toBase();
			expect(qty.scalar).toBe(273.15);
			expect(qty.unit()).toBe("tempK");

			qty = new Qty("0 tempF").toBase();
			expect(qty.scalar).toBeCloseTo(255.372, 3);
			expect(qty.unit()).toBe("tempK");
		});

		it("temperature degrees should have base unit in kelvin", function () {
			let qty = new Qty("1 degK").toBase();
			expect(qty.scalar).toBe(1);
			expect(qty.unit()).toBe("K");

			qty = new Qty("1 degR").toBase();
			expect(qty.scalar).toBe(5 / 9);
			expect(qty.unit()).toBe("K");

			qty = new Qty("1 degC").toBase();
			expect(qty.scalar).toBe(1);
			expect(qty.unit()).toBe("K");

			qty = new Qty("1 degF").toBase();
			expect(qty.scalar).toBe(5 / 9);
			expect(qty.unit()).toBe("K");
		});

		it("should not create temperatures below absolute zero", function () {
			expect(function () {
				new Qty("-1 tempK");
			}).toThrow();
			expect(function () {
				new Qty("-273.16 tempC");
			}).toThrow();
			expect(function () {
				new Qty("-459.68 tempF");
			}).toThrow();
			expect(function () {
				new Qty("-1 tempR");
			}).toThrow();

			let qty = new Qty("1 tempK");
			expect(function () {
				qty.mul("-1");
			}).toThrow();

			qty = new Qty("0 tempK");
			expect(function () {
				qty.sub("1 degK");
			}).toThrow();

			qty = new Qty("-273.15 tempC");
			expect(function () {
				qty.sub("1 degC");
			}).toThrow();

			qty = new Qty("-459.67 tempF");
			expect(function () {
				qty.sub("1 degF");
			}).toThrow();

			qty = new Qty("0 tempR");
			expect(function () {
				qty.sub("1 degR");
			}).toThrow();
		});

		it("should create simple", function () {
			const qty = new Qty("1m");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<meter>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("should create negative", function () {
			const qty = new Qty("-1m");
			expect(qty.scalar).toBe(-1);
			expect(qty.numerator).toEqual(["<meter>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("should create compound", function () {
			const qty = new Qty("1 N*m");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<newton>", "<meter>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("should create pressure units in term of height of water", function () {
			let qty = new Qty("1 inH2O");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<inh2o>"]);

			qty = new Qty("1 cmH2O");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<cmh2o>"]);
		});

		it("should create with denominator", function () {
			const qty = new Qty("1 m/s");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<meter>"]);
			expect(qty.denominator).toEqual(["<second>"]);
		});

		it("should create with denominator only", function () {
			let qty = new Qty("1 /s");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<second>"]);

			qty = new Qty("1 1/s");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<second>"]);

			qty = new Qty("1 s^-1");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<second>"]);
		});

		it("should create with powers", function () {
			let qty = new Qty("1 m^2/s^2");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<meter>", "<meter>"]);
			expect(qty.denominator).toEqual(["<second>", "<second>"]);
			qty = new Qty("1 m^2 kg^2 J^2/s^2");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual([
				"<meter>",
				"<meter>",
				"<kilogram>",
				"<kilogram>",
				"<joule>",
				"<joule>",
			]);
			expect(qty.denominator).toEqual(["<second>", "<second>"]);
			qty = new Qty("1 m^2/s^2*J^3");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<meter>", "<meter>"]);
			expect(qty.denominator).toEqual(["<second>", "<second>", "<joule>", "<joule>", "<joule>"]);
		});

		it("should create with zero power", function () {
			const qty = new Qty("1 m^0");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<1>"]);
			expect(qty.denominator).toEqual(["<1>"]);
		});

		it("should create with negative powers", function () {
			const qty = new Qty("1 m^2 s^-2");
			expect(qty.scalar).toBe(1);
			expect(qty.numerator).toEqual(["<meter>", "<meter>"]);
			expect(qty.denominator).toEqual(["<second>", "<second>"]);
			expect(qty.same(new Qty("1 m^2/s^2"))).toBe(true);
		});

		it("should accept powers without ^ syntax (simple)", function () {
			const qty1 = new Qty("1 m2");
			const qty2 = new Qty("1 m^2");
			expect(qty1.eq(qty2)).toBe(true);
		});

		it("should accept powers without ^ syntax (negative power)", function () {
			const qty1 = new Qty("1 m-2");
			const qty2 = new Qty("1 m^-2");
			expect(qty1.eq(qty2)).toBe(true);
		});

		it("should accept powers without ^ syntax (compound)", function () {
			const qty1 = new Qty("1 m^2 kg^2 J^2/s^2");
			const qty2 = new Qty("1 m2 kg2 J2/s2");
			expect(qty1.eq(qty2)).toBe(true);
		});

		it("should accept powers without ^ syntax (compound and negative power)", function () {
			const qty1 = new Qty("1 m^2 kg^2 J^2 s^-2");
			const qty2 = new Qty("1 m2 kg2 J2 s-2");
			expect(qty1.eq(qty2)).toBe(true);
		});

		it("should throw when parsing powers greater than 4", function () {
			// See github issue #73
			expect(function () {
				new Qty("593720475cm^4939207503");
			}).toThrow();
			expect(function () {
				new Qty("593720475cm**4939207503");
			}).toThrow();
		});

		it("should throw 'Unit not recognized' error when initializing with an invalid unit", function () {
			expect(function () {
				new Qty("aa");
			}).toThrow();
			expect(function () {
				new Qty("m/aa");
			}).toThrow();
			expect(function () {
				new Qty("m-");
			}).toThrow();
			expect(function () {
				new Qty("N*m");
			}).not.toThrow();
			// mm is millimeter, but mmm is not a valid unit
			expect(function () {
				new Qty("mmm");
			}).toThrow();
			// previously this value caused infinitely long regex test when checking if unit is correct
			expect(function () {
				new Qty("0.11 180°/sec");
			}).toThrow();
			// Crash-causing strings, See github issue #73
			expect(function () {
				new Qty("58261da44b642352442b8060");
			}).toThrow();
			expect(function () {
				new Qty("A1EB12B4233021311SH");
			}).toThrow();
		});

		if (typeof window === "undefined") {
			// only test in node.js
			it("does not crash with potentially dangerous strings", function () {
				// Multi-byte characters, emoji, etc.
				// From https://github.com/minimaxir/big-list-of-naughty-strings
				blns.forEach(function (s) {
					try {
						new Qty(s);
						// eslint-disable-next-line no-empty
					} catch (e) {}
				});
			});
		}

		it("should accept empty string as unitless 1", function () {
			expect(new Qty("").same(new Qty("1"))).toBe(true);
			expect(new Qty("   ").same(new Qty("1"))).toBe(true);
		});

		it("should throw error when passing NaN", function () {
			expect(function () {
				new Qty(NaN);
			}).toThrow();
		});

		it("should throw 'Unit not recognized' error when initializing with an invalid unit and a 0 exponent", function () {
			expect(function () {
				new Qty("3p0");
			}).toThrow();
			expect(function () {
				new Qty("3p-0");
			}).toThrow();
		});

		it("should set baseScalar", function () {
			let qty = new Qty("0.018 MPa");
			expect(qty.baseScalar).toBe(18000);

			qty = new Qty("66 cm3");
			expect(qty.baseScalar).toBe(0.000066);
		});

		it("should keep init value as is", function () {
			const initValue = "  66 cm3  ";
			const qty = new Qty(initValue);

			expect(qty.init).toEqual(initValue);
		});

		it("should allow whitespace-wrapped value", function () {
			expect(function () {
				new Qty("  2 MPa  ");
			}).not.toThrow();
		});

		it("should allow whitespaces between sign and scalar", function () {
			const qty = new Qty("-  1m");

			expect(qty.scalar).toEqual(-1);
			expect(qty.unit()).toEqual("m");
		});

		it("should throw an error when parsing negative quantity " + "with no scalar", function () {
			expect(function () {
				new Qty("-m");
			}).toThrow();
		});
	});

	describe("isCompatible", function () {
		it("should return true with compatible quantities", function () {
			const qty1 = new Qty("1 m*kg/s");
			let qty2 = new Qty("1 in*pound/min");
			expect(qty1.isCompatible(qty2)).toBe(true);
			qty2 = new Qty("1 in/min");
			expect(qty1.isCompatible(qty2)).toBe(false);
		});

		it("should return true with dimensionless quantities", function () {
			const qty1 = new Qty("1");
			const qty2 = new Qty("2");
			expect(qty1.isCompatible(qty2)).toBe(true);
		});
	});

	describe("conversion", function () {
		it("should convert to base units", function () {
			let qty = new Qty("100 cm");
			expect(qty.toBase().scalar).toBe(1);
			expect(qty.toBase().unit()).toBe("m");
			qty = new Qty("10 cm");
			expect(qty.toBase().scalar).toBe(0.1);
			expect(qty.toBase().unit()).toBe("m");
			qty = new Qty("0.3 mm^2 ms^-2");
			expect(qty.toBase().scalar).toBe(0.3);
			expect(qty.toBase().unit()).toBe("m2/s2");
		});

		it("should convert to compatible units", function () {
			let qty = new Qty("10 cm");
			expect(qty.to("ft").scalar).toBe(Qty.divSafe(0.1, 0.3048));
			qty = new Qty("2m^3");
			expect(qty.to("l").scalar).toBe(2000);

			qty = new Qty("10 cm");
			expect(qty.to(new Qty("m")).scalar).toBe(0.1);
			expect(qty.to(new Qty("20m")).scalar).toBe(0.1);

			qty = new Qty("1 m3");
			expect(qty.to("cm3").scalar).toBe(1000000);

			qty = new Qty("1 cm3");
			expect(qty.to("mm3").scalar).toBe(1000);

			qty = new Qty("550 cm3");
			expect(qty.to("cm^3").scalar).toBe(550);

			qty = new Qty("0.000773 m3");
			expect(qty.to("cm^3").scalar).toBe(773);
		});

		describe("percents", function () {
			it("should convert from % to unitless", function () {
				expect(new Qty("10 %").to("").same(new Qty("0.1"))).toBe(true);
			});

			it("should convert from unitless to %", function () {
				expect(new Qty("0.1").to("%").same(new Qty("10 %"))).toBe(true);
			});
		});

		it("new temp aliases should work", function () {
			const qty0 = new Qty("0 Kelvin");
			expect(qty0).not.toBeNull();
			const qty1 = new Qty("0 K");
			expect(qty1).not.toBeNull();
			const qty2 = new Qty("0 ºC");
			expect(qty2).not.toBeNull();
			const qty3 = new Qty("0 Celsius");
			expect(qty3).not.toBeNull();
			const qty4 = new Qty("0 Centigrade");
			expect(qty4).not.toBeNull();
			const qty5 = new Qty("0 ºF");
			expect(qty5).not.toBeNull();
			const qty6 = new Qty("0 Fahrenheit");
			expect(qty6).not.toBeNull();
		});

		it("should convert temperatures to compatible units", function () {
			let qty = new Qty("0 tempK");
			expect(qty.to("tempC").scalar).toBe(-273.15);

			qty = new Qty("0 tempF");
			expect(qty.to("tempK").scalar).toBeCloseTo(255.372, 3);

			qty = new Qty("32 tempF");
			expect(qty.to("tempC").scalar).toBe(0);

			qty = new Qty("0 tempC");
			expect(qty.to("tempF").scalar).toBeCloseTo(32, 10);
		});

		it("should convert temperature degrees to compatible units", function () {
			let qty = new Qty("0 degK");
			expect(qty.to("degC").scalar).toBe(0);

			qty = new Qty("1 degK/s");
			expect(qty.to("degC/min").scalar).toBe(60);

			qty = new Qty("100 cm/degF");
			expect(qty.to("m/degF").scalar).toBe(1);

			qty = new Qty("10 degC");
			expect(qty.to("degF").scalar).toBe(18);
		});

		it("should convert temperature degrees to temperatures", function () {
			// according to ruby-units, deg -> temp conversion adds the degress to 0 kelvin before converting
			let qty = new Qty("100 degC");
			expect(qty.to("tempC").scalar).toBeCloseTo(-173.15, 10);

			qty = new Qty("273.15 degC");
			expect(qty.to("tempC").scalar).toBe(0);

			qty = new Qty("460.67 degF");
			expect(qty.to("tempF").scalar).toBeCloseTo(1, 10);
		});

		it("should convert temperatures to temperature degrees", function () {
			// according to ruby-units, temp -> deg conversion always uses the 0 relative degrees
			let qty = new Qty("100 tempC");
			expect(qty.to("degC").scalar).toBe(100);

			qty = new Qty("0 tempK");
			expect(qty.to("degC").scalar).toBe(0);

			qty = new Qty("0 tempF");
			expect(qty.to("degK").scalar).toBe(0);

			qty = new Qty("18 tempF");
			expect(qty.to("degC").scalar).toBe(10);

			qty = new Qty("10 tempC");
			expect(qty.to("degF").scalar).toBe(18);
		});

		it("should calculate inverses", function () {
			let qty = new Qty("1 ohm");
			let result = qty.to("siemens");
			expect(result.scalar).toBe(1);
			expect(result.kind()).toBe("conductance");

			qty = new Qty("10 ohm");
			result = qty.to("siemens");
			expect(result.scalar).toBe(0.1);
			expect(result.kind()).toBe("conductance");

			qty = new Qty("10 siemens");
			result = qty.to("ohm");
			expect(result.scalar).toBe(0.1);
			expect(result.kind()).toBe("resistance");

			qty = new Qty("10 siemens");
			result = qty.inverse();
			expect(result.eq(".1 ohm")).toBe(true);
			expect(result.kind()).toBe("resistance");

			// cannot inverse a quantity with a 0 scalar
			qty = new Qty("0 ohm");
			expect(function () {
				qty.inverse();
			}).toThrow();

			qty = new Qty("10 ohm").inverse();
			result = qty.to("S");
			expect(result.scalar).toBe(0.1);
			expect(result.kind()).toBe("conductance");

			qty = new Qty("12 in").inverse();
			// TODO: Swap toBeCloseTo with toBe once divSafe is fixed
			expect(qty.to("ft").scalar).toBeCloseTo(1, 10);
		});

		it("should return itself if target units are the same", function () {
			let qty = new Qty("123 cm3");

			expect(qty.to("cm3")).toBe(qty);
			expect(qty.to("cm^3")).toBe(qty);

			qty = new Qty("123 mcg");
			expect(qty.to("ug")).toBe(qty);
		});

		it("should be cached", function () {
			const qty = new Qty("100 m");
			const converted = qty.to("ft");

			expect(qty.to("ft") === converted).toBe(true);
		});
	});

	describe("comparison", function () {
		it("should return true when comparing equal quantities", function () {
			const qty1 = new Qty("1cm");
			const qty2 = new Qty("10mm");
			expect(qty1.eq(qty2)).toBe(true);
		});

		it("should compare compatible quantities", function () {
			const qty1 = new Qty("1cm");
			const qty2 = new Qty("1mm");
			const qty3 = new Qty("10mm");
			const qty4 = new Qty("28A");
			expect(qty1.compareTo(qty2)).toBe(1);
			expect(qty2.compareTo(qty1)).toBe(-1);
			expect(qty1.compareTo(qty3)).toBe(0);
			expect(function () {
				qty1.compareTo(qty4);
			}).toThrow();

			expect(qty1.lt(qty2)).toBe(false);
			expect(qty1.lt(qty3)).toBe(false);
			expect(qty1.lte(qty3)).toBe(true);
			expect(qty1.gte(qty3)).toBe(true);
			expect(qty1.gt(qty2)).toBe(true);
			expect(qty2.gt(qty1)).toBe(false);
		});

		it("should compare identical quantities", function () {
			const qty1 = new Qty("1cm");
			const qty2 = new Qty("1cm");
			const qty3 = new Qty("10mm");
			expect(qty1.same(qty2)).toBe(true);
			expect(qty1.same(qty3)).toBe(false);
		});

		it("should accept strings as parameter", function () {
			const qty = new Qty("1 cm");
			expect(qty.lt("0.5 cm")).toBe(false);
			expect(qty.lte("1 cm")).toBe(true);
			expect(qty.gte("3 mm")).toBe(true);
			expect(qty.gt("5 m")).toBe(false);
		});
	});

	describe("non-ASCII character", function () {
		describe("µ", function () {
			it("should be supported as prefix", function () {
				// µ as greek letter
				expect(new Qty("1 \u03BCm").eq(new Qty("1 um"))).toBe(true);
				// µ as micro sign
				expect(new Qty("1 \u00B5m").eq(new Qty("1 um"))).toBe(true);
			});
		});

		describe("Ω", function () {
			it("should be accepted as unit for ohm", function () {
				// Ω as greek letter
				expect(new Qty("1 \u03A9").eq(new Qty("1 ohm"))).toBe(true);
				// Ω as ohm sign
				expect(new Qty("1 \u2126").eq(new Qty("1 ohm"))).toBe(true);
			});
		});
	});

	describe("math", function () {
		it("should add quantities", function () {
			const qty1 = new Qty("2.5m");
			let qty2 = new Qty("3m");
			expect(qty1.add(qty2).scalar).toBe(5.5);

			expect(qty1.add("3m").scalar).toBe(5.5);

			qty2 = new Qty("3cm");
			let result = qty1.add(qty2);
			expect(result.scalar).toBe(2.53);
			expect(result.unit()).toBe("m");

			result = qty2.add(qty1);
			expect(result.scalar).toBe(253);
			expect(result.unit()).toBe("cm");

			// make sure adding 2 of the same non-base units work
			result = new Qty("5cm").add("3cm");
			expect(result.scalar).toBe(8);
			expect(result.unit()).toBe("cm");
		});

		it("should fail to add unlike quantities", function () {
			const qty1 = new Qty("3m");
			const qty2 = new Qty("2s");
			expect(function () {
				qty1.add(qty2);
			}).toThrow();
			expect(function () {
				qty2.add(qty1);
			}).toThrow();
		});

		it("should fail to add inverse quantities", function () {
			let qty1 = new Qty("10S");
			let qty2 = qty1.inverse();
			expect(function () {
				qty1.add(qty2);
			}).toThrow();
			expect(function () {
				qty2.add(qty1);
			}).toThrow();

			qty1 = new Qty("10S");
			qty2 = new Qty("0.1ohm");
			expect(function () {
				qty1.add(qty2);
			}).toThrow();
			expect(function () {
				qty2.add(qty1);
			}).toThrow();
		});

		it("should subtract quantities", function () {
			const qty1 = new Qty("2.5m");
			let qty2 = new Qty("3m");
			expect(qty1.sub(qty2).scalar).toBe(-0.5);

			expect(qty1.sub("2m").scalar).toBe(0.5);
			expect(qty1.sub("-2m").scalar).toBe(4.5);

			qty2 = new Qty("3cm");
			let result = qty1.sub(qty2);
			expect(result.scalar).toBe(2.47);
			expect(result.unit()).toBe("m");

			result = qty2.sub(qty1);
			expect(result.scalar).toBe(-247);
			expect(result.unit()).toBe("cm");
		});

		it("should fail to subtract unlike quantities", function () {
			const qty1 = new Qty("3m");
			const qty2 = new Qty("2s");
			expect(function () {
				qty1.sub(qty2);
			}).toThrow();
			expect(function () {
				qty2.sub(qty1);
			}).toThrow();
		});

		it("should fail to subtract inverse quantities", function () {
			let qty1 = new Qty("10S");
			let qty2 = qty1.inverse();
			expect(function () {
				qty1.sub(qty2);
			}).toThrow();
			expect(function () {
				qty2.sub(qty1);
			}).toThrow();

			qty1 = new Qty("10S");
			qty2 = new Qty("0.1ohm");
			expect(function () {
				qty1.sub(qty2);
			}).toThrow();
			expect(function () {
				qty2.sub(qty1);
			}).toThrow();
		});

		it("should multiply quantities", function () {
			const qty1 = new Qty("2.5m");
			let qty2 = new Qty("3m");
			let result = qty1.mul(qty2);
			expect(result.scalar).toBe(7.5);
			expect(result.unit()).toBe("m2");
			expect(result.kind()).toBe("area");

			qty2 = new Qty("3cm");
			result = qty1.mul(qty2);
			expect(result.scalar).toBe(0.075);
			expect(result.unit()).toBe("m2");

			result = qty2.mul(qty1);
			expect(result.scalar).toBe(750);
			expect(result.unit()).toBe("cm2");

			result = qty1.mul(3.5);
			expect(result.scalar).toBe(8.75);
			expect(result.unit()).toBe("m");

			result = qty1.mul(0);
			expect(result.scalar).toBe(0);
			expect(result.unit()).toBe("m");

			result = qty1.mul(new Qty("0m"));
			expect(result.scalar).toBe(0);
			expect(result.unit()).toBe("m2");

			qty2 = new Qty("1.458 m");
			result = qty1.mul(qty2);
			expect(result.scalar).toBe(3.645);
			expect(result.unit()).toBe("m2");
		});

		it("should multiply unlike quantities", function () {
			let qty1 = new Qty("2.5 m");
			let qty2 = new Qty("3 N");

			let result = qty1.mul(qty2);
			expect(result.scalar).toBe(7.5);

			qty1 = new Qty("2.5 m^2");
			qty2 = new Qty("3 kg/m^2");

			result = qty1.mul(qty2);
			expect(result.scalar).toBe(7.5);
			expect(result.unit()).toBe("kg");
		});

		it("should multiply inverse quantities", function () {
			const qty1 = new Qty("10S");
			const qty2 = new Qty(".5S").inverse(); // 2/S
			const qty3 = qty1.inverse(); // .1/S

			let result = qty1.mul(qty2);
			expect(result.scalar).toBe(20);
			expect(result.isUnitless()).toBe(true);
			expect(result.unit()).toBe("");
			// swapping operands should give the same outcome
			result = qty2.mul(qty1);
			expect(result.scalar).toBe(20);
			expect(result.isUnitless()).toBe(true);
			expect(result.unit()).toBe("");

			result = qty1.mul(qty3);
			expect(result.scalar).toBe(1);
			expect(result.isUnitless()).toBe(true);
			expect(result.unit()).toBe("");
			// swapping operands should give the same outcome
			result = qty3.mul(qty1);
			expect(result.scalar).toBe(1);
			expect(result.isUnitless()).toBe(true);
			expect(result.unit()).toBe("");
		});

		it("should multiply quantities and their inverses with prefixes", function () {
			let qty1 = new Qty("3m");
			let qty2 = new Qty("4 1/km");
			let result = qty1.mul(qty2);
			expect(result.scalar).toBe(0.012);
			expect(result.isUnitless()).toBe(true);

			qty1 = new Qty("3 A/km");
			qty2 = new Qty("4 m");
			result = qty1.mul(qty2);
			expect(result.scalar).toBe(0.012);
			expect(result.unit()).toBe("A");

			qty1 = new Qty("3 1/km2");
			qty2 = new Qty("4 m");
			result = qty1.mul(qty2);
			expect(result.scalar).toBe(0.012);
			expect(result.unit()).toBe("1/km");

			qty1 = new Qty("4 m");
			qty2 = new Qty("3 1/km2");
			result = qty1.mul(qty2);
			expect(result.scalar).toBe(0.000012);
			expect(result.unit()).toBe("1/m");
		});

		it("should divide quantities", function () {
			const qty1 = new Qty("2.5m");
			const qty2 = new Qty("3m");
			const qty3 = new Qty("0m");

			expect(function () {
				qty1.div(qty3);
			}).toThrow();
			expect(function () {
				qty1.div(0);
			}).toThrow();
			expect(qty3.div(qty1).scalar).toBe(0);

			let result = qty1.div(qty2);
			expect(result.scalar).toBe(2.5 / 3);
			expect(result.unit()).toBe("");
			expect(result.kind()).toBe("unitless");

			const qty4 = new Qty("3cm");
			result = qty1.div(qty4);
			expect(result.scalar).toBe(2.5 / 0.03);
			expect(result.unit()).toBe("");

			result = qty4.div(qty1);
			expect(result.scalar).toBe(0.012);
			expect(result.unit()).toBe("");

			result = qty1.div(3.5);
			expect(result.scalar).toBe(2.5 / 3.5);
			expect(result.unit()).toBe("m");
		});

		it("should divide unlike quantities", function () {
			const qty1 = new Qty("7.5kg");
			const qty2 = new Qty("2.5m^2");

			const result = qty1.div(qty2);
			expect(result.scalar).toBe(3);
			expect(result.unit()).toBe("kg/m2");
		});

		it("should divide inverse quantities", function () {
			const qty1 = new Qty("10 S");
			const qty2 = new Qty(".5 S").inverse(); // 2/S
			const qty3 = qty1.inverse(); // .1/S

			let result = qty1.div(qty2);
			expect(result.scalar).toBe(5);
			expect(result.unit()).toBe("S2");

			result = qty2.div(qty1);
			expect(result.scalar).toBe(0.2);
			expect(result.unit()).toBe("1/S2");

			result = qty1.div(qty3);
			expect(result.scalar).toBe(100);
			expect(result.unit()).toBe("S2");

			result = qty3.div(qty1);
			expect(result.scalar).toBe(0.01);
			expect(result.unit()).toBe("1/S2");
		});

		it("should divide quantities and their inverses with prefixes", function () {
			let qty1 = new Qty("3m*A");
			let qty2 = new Qty("4 km");
			let result = qty1.div(qty2);
			expect(result.scalar).toBe(0.00075);
			expect(result.unit()).toBe("A");

			qty1 = new Qty("3 m");
			qty2 = new Qty("4 km*A");
			result = qty1.div(qty2);
			expect(result.scalar).toBe(0.00075);
			expect(result.unit()).toBe("1/A");

			qty1 = new Qty("3 m");
			qty2 = new Qty("4 km*cA");
			result = qty1.div(qty2);
			expect(result.scalar).toBe(0.00075);
			expect(result.unit()).toBe("1/cA");
		});
	});

	describe("math with temperatures", function () {
		it("should add temperature degrees", function () {
			let qty = new Qty("2degC");
			expect(qty.add("3degF").scalar).toBeCloseTo(11 / 3, 10);
			expect(qty.add("-1degC").scalar).toBe(1);

			qty = new Qty("2 degC");
			let result = qty.add("2 degF");
			expect(result.scalar).toBe(28 / 9);
			expect(result.unit()).toBe("°C");

			qty = new Qty("2degK");
			result = qty.add("3degC");
			expect(result.scalar).toBe(5);
			expect(result.unit()).toBe("K");

			qty = new Qty("2degC");
			result = qty.add("2degK");
			expect(result.scalar).toBe(4);
			expect(result.unit()).toBe("°C");
		});

		it("should not add two temperatures", function () {
			const qty = new Qty("2tempC");
			expect(function () {
				qty.add("1 tempF");
			}).toThrow();
			expect(function () {
				qty.add("1 tempC");
			}).toThrow();
		});

		it("should add temperatures to degrees", function () {
			let qty = new Qty("2degC");
			let result = qty.add("3tempF");
			expect(result.scalar).toBe(33 / 5);
			expect(result.unit()).toBe("tempF");

			result = qty.add("-1tempC");
			expect(result.scalar).toBe(1);
			expect(result.unit()).toBe("tempC");

			qty = new Qty("2 tempC");
			result = qty.add("2 degF");
			expect(result.scalar).toBe(28 / 9);
			expect(result.unit()).toBe("tempC");
		});

		it("should subtract degrees from degrees", function () {
			const qty = new Qty("2degC");
			expect(qty.sub("1.5degK").scalar).toBe(0.5);
			expect(qty.sub("-2degC").scalar).toBe(4);
			expect(qty.sub("1degF").scalar).toBe(2 - 5 / 9);
			expect(qty.sub("-1degC").scalar).toBe(3);

			const result = qty.sub("degC");
			expect(result.scalar).toBe(1);
			expect(result.unit()).toBe("°C");
		});

		it("should subtract degrees from temperatures", function () {
			const qty = new Qty("2tempC");
			expect(qty.sub("1.5degK").scalar).toBe(0.5);
			expect(qty.sub("-2degC").scalar).toBe(4);
			expect(qty.sub("1degF").scalar).toBe(2 - 5 / 9);
			expect(qty.sub("-1degC").scalar).toBe(3);

			const result = qty.sub("degC");
			expect(result.scalar).toBe(1);
			expect(result.unit()).toBe("tempC");
		});

		it("should subtract temperatures from temperatures", function () {
			const qty = new Qty("2tempC");

			let result = qty.sub("1.5tempK");
			expect(result.scalar).toBe(273.65);
			expect(result.unit()).toBe("°C");

			result = qty.sub("-2tempC");
			expect(result.scalar).toBe(4);
			expect(result.unit()).toBe("°C");

			result = qty.sub("32tempF");
			expect(result.scalar).toBe(2);
			expect(result.unit()).toBe("°C");
		});

		it("should not subtract temperatures from degrees", function () {
			const qty = new Qty("2degC");
			expect(function () {
				qty.sub("1 tempF");
			}).toThrow();
			expect(function () {
				qty.sub("1 tempC");
			}).toThrow();
		});

		it("should multiply temperature degrees", function () {
			let qty = new Qty("2degF");
			let result = qty.mul(3);
			expect(result.scalar).toBe(6);
			expect(result.unit()).toBe("°F");

			result = qty.mul("3degF");
			expect(result.scalar).toBe(6);
			expect(result.unit()).toBe("°F2");

			// TODO: Should we convert degrees ("2 degK" to "degC") before we do the math?
			qty = new Qty("2degC");
			result = qty.mul("2degK");
			expect(result.scalar).toBe(4);
			expect(result.unit()).toBe("°C*K");

			qty = new Qty("2degC");
			result = qty.mul("degF");
			expect(result.scalar).toBe(2);
			expect(result.unit()).toBe("°C*°F");
		});

		it("should not multiply temperatures except by scalar", function () {
			const qty = new Qty("2tempF");
			expect(function () {
				qty.mul("1 tempC");
			}).toThrow();
			expect(function () {
				qty.mul("1 degC");
			}).toThrow();
			expect(function () {
				new Qty("1 tempC*s");
			}).toThrow();

			let result = qty.mul(2);
			expect(result.scalar).toBe(4);
			expect(result.unit()).toBe("tempF");

			result = new Qty("2").mul(qty);
			expect(result.scalar).toBe(4);
			expect(result.unit()).toBe("tempF");
		});

		it("should multiply temperature degrees with unlike quantities", function () {
			let qty1 = new Qty("2.5 degF");
			let qty2 = new Qty("3 m");

			let result = qty1.mul(qty2);
			expect(result.scalar).toBe(7.5);

			qty1 = new Qty("2.5 degF");
			qty2 = new Qty("3 kg/degF");

			result = qty1.mul(qty2);
			expect(result.scalar).toBe(7.5);
			expect(result.unit()).toBe("kg");
		});

		it("should divide temperature degrees with unlike quantities", function () {
			const qty1 = new Qty("7.5degF");
			const qty2 = new Qty("2.5m^2");

			const result = qty1.div(qty2);
			expect(result.scalar).toBe(3);
			expect(result.unit()).toBe("°F/m2");
		});

		it("should divide temperature degree quantities", function () {
			const qty = new Qty("2.5 degF");

			expect(function () {
				qty.div("0 degF");
			}).toThrow();
			expect(function () {
				qty.div(0);
			}).toThrow();
			expect(new Qty("0 degF").div(qty).scalar).toBe(0);
			expect(new Qty("0 degF").div(qty).unit()).toBe("");

			let result = qty.div("3 degF");
			expect(result.scalar).toBe(2.5 / 3);
			expect(result.unit()).toBe("");
			expect(result.kind()).toBe("unitless");

			result = qty.div(3);
			expect(result.scalar).toBe(2.5 / 3);
			expect(result.unit()).toBe("°F");
			expect(result.kind()).toBe("temperature");

			// TODO: Should we convert "2 degC" to "degF" before we do the math?
			result = qty.div("2 degC");
			expect(result.scalar).toBe(1.25);
			expect(result.unit()).toBe("°F/°C");
		});

		it("should not divide with temperatures except by scalar", function () {
			expect(function () {
				new Qty("tempF").div("1 tempC");
			}).toThrow();
			expect(function () {
				new Qty("tempF").div("1 degC");
			}).toThrow();
			expect(function () {
				new Qty("2").div("tempF");
			}).toThrow();
			expect(function () {
				new Qty("2 tempF/s");
			}).toThrow();
			expect(function () {
				new Qty("2 s/tempF");
			}).toThrow();

			// inverse is division: 1/x
			expect(function () {
				new Qty("tempF").inverse();
			}).toThrow();

			const result = new Qty("4 tempF").div(2);
			expect(result.scalar).toBe(2);
			expect(result.unit()).toBe("tempF");
		});
	});

	describe("utility methods", function () {
		it("should accept string as parameter for compatibility tests", function () {
			const qty = new Qty("1 mm");

			expect(qty.isCompatible("2 mm")).toBe(true);
			expect(qty.isCompatible("2 mm^3")).toBe(false);
		});

		it("should return kind", function () {
			let qty = new Qty("1 mm");
			expect(qty.kind()).toBe("length");

			qty = new Qty("1 N");
			expect(qty.kind()).toBe("force");
		});

		it("should know if a quantity is in base units", function () {
			let qty = new Qty("100 cm");
			expect(qty.isBase()).toBe(false);

			qty = new Qty("1m");
			expect(qty.isBase()).toBe(true);
		});

		it("should return unit part of quantities", function () {
			let qty = new Qty("1");
			expect(qty.unit()).toBe("");
			qty = new Qty("1 /s");
			expect(qty.unit()).toBe("1/s");
			qty = new Qty("100 cm");
			expect(qty.unit()).toBe("cm");
			qty = new Qty("100 cm/s");
			expect(qty.unit()).toBe("cm/s");
			qty = new Qty("1 cm^2");
			expect(qty.unit()).toBe("cm2");
			qty = new Qty("1 cm^2/s^2");
			expect(qty.unit()).toBe("cm2/s2");
			qty = new Qty("1 cm^2*J^3/s^2*A^2");
			expect(qty.unit()).toBe("cm2*J3/s2*A2");
		});
	});

	describe("toString", function () {
		it("should generate readable human output", function () {
			let qty = new Qty("2m");
			expect(qty.toString()).toBe("2 m");
			expect(qty.toString("cm")).toBe("200 cm");
			expect(qty.toString("km")).toBe("0.002 km");
			expect(function () {
				qty.toString("A");
			}).toThrow();

			qty = new Qty("24.5m/s");
			expect(qty.toString()).toBe("24.5 m/s");
			expect(function () {
				qty.toString("m");
			}).toThrow();
			expect(qty.toString("km/h")).toBe("88.2 km/h");

			qty = new Qty("254kg/m^2");
			expect(qty.toString()).toBe("254 kg/m2");

			qty = new Qty("2");
			expect(qty.toString()).toBe("2");
		});

		it("should round readable human output when max decimals is specified", function () {
			let qty = new Qty("2m").div(3);
			expect(qty.toString("cm", 2)).toBe("66.67 cm");

			qty = new Qty("2.8m");
			expect(qty.toString("m", 0)).toBe("3 m");
			expect(qty.toString("cm", 0)).toBe("280 cm");
			qty = new Qty("2.818m");
			expect(qty.toString("cm", 0)).toBe("282 cm");
		});

		it("should round to max decimals", function () {
			const qty = new Qty("2.987654321 m");

			expect(qty.toString(3)).toBe("2.988 m");
			expect(qty.toString(0)).toBe("3 m");
		});

		it("should round according to precision passed as quantity", function () {
			const qty = new Qty("5.17 ft");

			expect(qty.toString(new Qty("ft"))).toBe("5 ft");
			expect(qty.toString(new Qty("2 ft"))).toBe("6 ft");
			expect(qty.toString(new Qty("0.5 ft"))).toBe("5 ft");
			expect(qty.toString(new Qty("0.1 ft"))).toBe("5.2 ft");
			expect(qty.toString(new Qty("0.05 ft"))).toBe("5.15 ft");
			expect(qty.toString(new Qty("0.01 ft"))).toBe("5.17 ft");
			expect(qty.toString(new Qty("0.0001 ft"))).toBe("5.17 ft");
		});

		it("should return same output with successive calls", function () {
			const qty = new Qty("123 cm3");
			expect(qty.toString("cm3", 0)).toBe("123 cm3");
			expect(qty.toString("cm3", 0)).toBe("123 cm3");
		});

		it("should return identical output when called with no parameters or same units", function () {
			const qty = new Qty("123 cm3");
			expect(qty.toString()).toBe(qty.toString("cm3"));
		});
	});

	describe("format", function () {
		describe("provided default formatter", function () {
			it("should be applied to output", function () {
				const qty = new Qty("2.987654321 m");

				expect(qty.format()).toBe("2.987654321 m");
			});
		});

		describe("custom formatter", function () {
			const roundingFormatter = function (maxDecimals: number) {
				return function (scalar: number, units: string) {
					const pow = Math.pow(10, maxDecimals);
					const rounded = Math.round(scalar * pow) / pow;

					return `${rounded} ${units}`;
				};
			};

			it("should be applied to output", function () {
				const qty = new Qty("2.987654321 m");

				expect(qty.format(roundingFormatter(3))).toBe("2.988 m");
				expect(qty.format(roundingFormatter(0))).toBe("3 m");
			});

			it("should be applied after conversion to target units", function () {
				let qty = new Qty("2m").div(3);
				expect(qty.format("cm", roundingFormatter(2))).toBe("66.67 cm");

				const intRoundingFormatter = roundingFormatter(0);
				qty = new Qty("2.8m");
				expect(qty.format("m", intRoundingFormatter)).toBe("3 m");
				expect(qty.format("cm", intRoundingFormatter)).toBe("280 cm");
				qty = new Qty("2.818m");
				expect(qty.format("cm", intRoundingFormatter)).toBe("282 cm");
			});

			describe("globally set as default formatter", function () {
				let previousFormatter: (scalar: number, units: string) => string;

				beforeEach(function () {
					previousFormatter = Qty.formatter;
					Qty.formatter = roundingFormatter(3);
				});

				afterEach(function () {
					// Restore previous formatter
					Qty.formatter = previousFormatter;
				});

				it("should be applied when no formatter is passed", function () {
					const qty = new Qty("2.987654321 m");

					expect(qty.format()).toBe("2.988 m");
				});
			});
		});

		it("unit without scalar", () => {
			expect(Qty.parse("mole/l")?.unit()).toEqual("mol/l");
			expect(Qty.parse("mol/l")?.unit()).toEqual("mol/l");
			expect(Qty.parse("mol/L")?.unit()).toEqual("mol/l");
			expect(Qty.parse("mol/litres")?.unit()).toEqual("mol/l");
			expect(Qty.parse("5 mol/l")?.unit()).toEqual("mol/l");
			expect(Qty.parse("3.4554e10 mol/l")?.unit()).toEqual("mol/l");
		});
	});

	describe("precision rounding", function () {
		it("should round according to precision passed as quantity with same units", function () {
			const qty = new Qty("5.17 ft");

			expect(qty.toPrec(new Qty("ft")).toString()).toBe("5 ft");
			expect(qty.toPrec(new Qty("2 ft")).toString()).toBe("6 ft");
			expect(qty.toPrec(new Qty("10 ft")).toString()).toBe("10 ft");
			expect(qty.toPrec(new Qty("0.5 ft")).toString()).toBe("5 ft");
			expect(qty.toPrec(new Qty("0.1 ft")).toString()).toBe("5.2 ft");
			expect(qty.toPrec(new Qty("0.05 ft")).toString()).toBe("5.15 ft");
			expect(qty.toPrec(new Qty("0.01 ft")).toString()).toBe("5.17 ft");
			expect(qty.toPrec(new Qty("0.0001 ft")).toString()).toBe("5.17 ft");
			expect(qty.toPrec(new Qty("0.25 ft")).toString()).toBe("5.25 ft");
		});

		it("should allow string as precision parameter", function () {
			const qty = new Qty("5.17 ft");

			expect(qty.toPrec("ft").toString()).toBe("5 ft");
			expect(qty.toPrec("0.5 ft").toString()).toBe("5 ft");
			expect(qty.toPrec("0.05 ft").toString()).toBe("5.15 ft");
		});

		it("should round according to precision passed as quantity with different prefixes", function () {
			const qty = new Qty("6.3782 m");

			expect(qty.toPrec(new Qty("dm")).toString()).toBe("6.4 m");
			expect(qty.toPrec(new Qty("cm")).toString()).toBe("6.38 m");
			expect(qty.toPrec(new Qty("mm")).toString()).toBe("6.378 m");

			expect(qty.toPrec(new Qty("5 cm")).toString()).toBe("6.4 m");
		});

		it("should round according to precision passed as quantity with different compatible units", function () {
			let qty = new Qty("1.146 MPa");
			expect(qty.toPrec(new Qty("0.1 bar")).toString()).toBe("1.15 MPa");
			expect(qty.toPrec(new Qty("0.01 MPa")).toString()).toBe("1.15 MPa");
			expect(qty.toPrec(new Qty("dbar")).toString()).toBe("1.15 MPa");

			// Tests below are mainly a safety net because not sure if there is
			// any usefulness to do things like that
			qty = new Qty("5.171234568 ft");
			expect(qty.toPrec(new Qty("m")).toString()).toBe("6.561679790026248 ft");
			expect(qty.toPrec(new Qty("dm")).toString()).toBe("5.249343832020998 ft");
			expect(qty.toPrec(new Qty("cm")).toString()).toBe("5.183727034120736 ft");
			expect(qty.toPrec(new Qty("mm")).toString()).toBe("5.170603674540684 ft");
		});
	});

	describe("mulSafe", function () {
		it("should multiply while trying to avoid numerical errors", function () {
			expect(Qty.mulSafe(0.1, 0.1)).toBe(0.01);
			expect(Qty.mulSafe(1e-11, 123.456789)).toBe(1.23456789e-9);
			expect(Qty.mulSafe(6e-12, 100000)).toBe(6e-7);
		});
	});

	describe("divSafe", function () {
		it("should divide while trying to avoid numerical errors", function () {
			expect(Qty.divSafe(0.000773, 0.000001)).toBe(773);
			// TODO uncomment and fix
			//expect(Qty.divSafe(24.5, 0.2777777777777778)).toBe(88.2);
		});
	});

	describe("Qty.parse", function () {
		it("should not throw if parsed argument is a string", function () {
			expect(function () {
				Qty.parse("foo");
			}).not.toThrow();
		});

		it("should return parsed quantity when passing a valid quantity", function () {
			expect(Qty.parse("2.5 m") instanceof Qty).toBe(true);
		});

		it("should return null when passing an invalid quantity", function () {
			expect(Qty.parse("aa")).toBeNull();
		});

		it("should work", function () {
			expect(function () {
				Qty.parse("VL170111115924");
			}).not.toThrow();
		});

		it("should support the kind mass flow", function () {
			expect(Qty.parse("kg/s")?.kind()).toBe("mass_flow");
			expect(Qty.parse("g/s")?.kind()).toBe("mass_flow");
			expect(Qty.parse("kg/h")?.kind()).toBe("mass_flow");
		});
	});

	describe("Qty.swiftConverter", function () {
		it("should return a function", function () {
			expect(typeof Qty.swiftConverter("m/h", "ft/s")).toBe("function");
		});

		it("should throw when passing incompatible units", function () {
			expect(function () {
				Qty.swiftConverter("m", "s");
			}).toThrow();
		});

		describe("converter", function () {
			describe("single value", function () {
				it("should convert value", function () {
					// TODO Same test but with m/h -> ft/s triggers rounding issue
					// (For the sake of speed, converter does not check and fix rounding issues)
					const converter = Qty.swiftConverter("m/h", "m/s");

					expect(converter(2500)).toEqual(new Qty("2500 m/h").to("m/s").scalar);
				});

				it("should returned value unchanged when units are identical", function () {
					const converter = Qty.swiftConverter("m/h", "m/h");

					expect(converter(2500)).toEqual(2500);
				});

				it("should convert temperatures", function () {
					const converter = Qty.swiftConverter("tempF", "tempC");

					expect(converter(32)).toEqual(0);
				});

				it("should convert degrees", function () {
					const converter = Qty.swiftConverter("degC", "degF");

					expect(converter(10)).toEqual(18);
				});
			});

			describe("array of values", function () {
				it("should be converted", function () {
					const converter = Qty.swiftConverter("MPa", "bar");
					const values = [250, 10, 15];
					const expected = [2500, 100, 150];

					expect(converter(values)).toEqual(expected);
				});
			});
		});
	});

	describe("Qty.getKinds", function () {
		it("should return an array of kind names", function () {
			expect(Qty.getKinds()).toContain("resistance");
		});

		it("should not contain duplicate kind names", function () {
			const kinds = Qty.getKinds();
			const map: { [key: string]: number } = {};
			kinds.forEach(function (kind) {
				map[kind] = 1;
			});
			expect(kinds).toHaveLength(Object.keys(map).length);
		});
	});

	describe("Qty.getUnits", function () {
		it("should return an array of units of kind", function () {
			expect(Qty.getUnits("currency")).toContain("dollar");
		});
		it("should return an array of all units without arg", function () {
			expect(Qty.getUnits()).toContain("sievert");
		});
		it("should throw unknown kind", function () {
			expect(function () {
				Qty.getUnits("bogusKind");
			}).toThrow();
		});
	});

	describe("Qty.getAliases", function () {
		it("should return array of alternative names for unit", function () {
			expect(Qty.getAliases("m")).toContain("meter");
			expect(Qty.getAliases("meter")).toContain("metre");
			expect(Qty.getAliases("N")).toContain("newton");
		});
	});

	describe("information", function () {
		describe("bits and bytes", function () {
			it("should have 'information' as kind", function () {
				expect(new Qty("3 b").kind()).toBe("information");
				expect(new Qty("5 B").kind()).toBe("information");
			});

			it("could be pluralized", function () {
				expect(new Qty("3 bits").eq(new Qty("3 b"))).toBe(true);
				expect(new Qty("5 bytes").eq(new Qty("5 B"))).toBe(true);
			});
		});

		describe("rate", function () {
			it("should accept bps and Bps aliases", function () {
				expect(new Qty("3 bps").eq(new Qty("3 b/s"))).toBe(true);
				expect(new Qty("5 Bps").eq(new Qty("5 B/s"))).toBe(true);
			});

			it("should be parsed when prefixed", function () {
				expect(new Qty("3 kbps").eq(new Qty("3 kb/s"))).toBe(true);
				expect(new Qty("5 MBps").eq(new Qty("5 MB/s"))).toBe(true);
			});

			it("should have 'information_rate' as kind", function () {
				expect(new Qty("3 bps").kind()).toBe("information_rate");
				expect(new Qty("5 Bps").kind()).toBe("information_rate");
			});
		});
	});

	describe("non regression tests", function () {
		describe("Wh (#38)", function () {
			it("should be parsed", function () {
				expect(new Qty("Wh").eq(new Qty("3600 J"))).toBe(true);
			});

			it("should be parsed when prefixed", function () {
				expect(new Qty("kWh").eq(new Qty("1000 Wh"))).toBe(true);
			});
		});

		describe("Ah (#25)", function () {
			it("should be parsed", function () {
				expect(new Qty("Ah").eq(new Qty("3600 C"))).toBe(true);
			});

			it("should be parsed when prefixed", function () {
				expect(new Qty("mAh").eq(new Qty("3.6 C"))).toBe(true);
			});
		});

		describe("Farad (#67)", function () {
			it("should be equal to its definition", function () {
				expect(new Qty("1 F").eq(new Qty("1 C").div(new Qty("1 V")))).toBe(true);
			});

			it("should not be defined as base unit", function () {
				const qty = new Qty("F");

				expect(qty.isBase()).toBe(false);
				expect(qty.toBase().unit()).toEqual("s4*A2/m2*kg");
			});

			it("should be parsed when prefixed", function () {
				const qty = new Qty("100 nF");

				expect(qty.eq(new Qty("100 F").div(1e9))).toBe(true);
				expect(qty.baseScalar).toEqual(1e-7);
			});
		});
	});

	describe("convertSingleUnit", function () {
		it("should convert simple units", function () {
			let qty = new Qty("10 kWh");
			expect(qty.convertSingleUnit("kWh", "MWh").scalar).toEqual(0.01);
			expect(qty.convertSingleUnit("kWh", "Wh").scalar).toEqual(10000);
			expect(qty.convertSingleUnit("kWh", "MWh").unit()).toEqual("MWh");
			qty = new Qty("1.68784e-4 m");
			expect(qty.convertSingleUnit("m", "dm").scalar).toEqual(1.68784e-3);
			expect(qty.convertSingleUnit("m", "km").scalar).toEqual(1.68784e-7);
		});

		it("should convert advanced units", function () {
			const qty = new Qty("42 m/s");
			expect(qty.convertSingleUnit("m", "km").scalar).toEqual(0.042);
			expect(qty.convertSingleUnit("m", "km").unit()).toEqual("km/s");

			expect(qty.convertSingleUnit("s", "h").scalar).toEqual(151200);
			expect(qty.convertSingleUnit("s", "h").unit()).toEqual("m/h");
		});

		it("should error if units are incompatible", function () {
			const qty = new Qty(1337, "N");
			expect(() => {
				qty.convertSingleUnit("N", "m");
			}).toThrow();
			expect(() => {
				qty.convertSingleUnit("A", "J");
			}).toThrow();
		});

		it("should error if units are not simple", function () {
			const qty = new Qty(1664, "m/s");
			expect(() => {
				qty.convertSingleUnit("m/s", "km/h");
			}).toThrow();
			expect(() => {
				qty.convertSingleUnit("USD/kWh", "USD/MWh");
			}).toThrow();
		});
	});
});
