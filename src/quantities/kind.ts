import { Qty } from "./constructor";
import { IRegularObject } from "./types";
import { uniq } from "./utils";

export type UnitKind =
	| "elastance"
	| "resistance"
	| "inductance"
	| "potential"
	| "specific_volume"
	| "snap"
	| "jolt"
	| "acceleration"
	| "radiation"
	| "frequency"
	| "speed"
	| "volumetric_flow"
	| "wavenumber"
	| "unitless"
	| "length"
	| "area"
	| "volume"
	| "time"
	| "temperature"
	| "yank"
	| "power"
	| "pressure"
	| "force"
	| "energy"
	| "viscosity"
	| "mass_flow"
	| "momentum"
	| "angular_momentum"
	| "density"
	| "area_density"
	| "mass"
	| "radiation_exposure"
	| "magnetism"
	| "current"
	| "charge"
	| "conductance"
	| "capacitance"
	| "activity"
	| "molar_concentration"
	| "substance"
	| "illuminance"
	| "luminous_power"
	| "currency"
	| "information_rate"
	| "information"
	| "angular_velocity"
	| "angle";

const kindsMapping: IRegularObject<UnitKind> = {
	"-312078": "elastance",
	"-312058": "resistance",
	"-312038": "inductance",
	"-152058": "potential",
	"-152040": "magnetism",
	"-152038": "magnetism",
	"-7997": "specific_volume",
	"-79": "snap",
	"-59": "jolt",
	"-39": "acceleration",
	"-38": "radiation",
	"-20": "frequency",
	"-19": "speed",
	"-18": "viscosity",
	"-17": "volumetric_flow",
	"-1": "wavenumber",
	"0": "unitless",
	"1": "length",
	"2": "area",
	"3": "volume",
	"20": "time",
	"400": "temperature",
	"7941": "yank",
	"7942": "power",
	"7959": "pressure",
	"7961": "force",
	"7962": "energy",
	"7979": "viscosity",
	"7980": "mass_flow",
	"7981": "momentum",
	"7982": "angular_momentum",
	"7997": "density",
	"7998": "area_density",
	"8000": "mass",
	"152020": "radiation_exposure",
	"159999": "magnetism",
	"160000": "current",
	"160020": "charge",
	"312058": "conductance",
	"312078": "capacitance",
	"3199980": "activity",
	"3199997": "molar_concentration",
	"3200000": "substance",
	"63999998": "illuminance",
	"64000000": "luminous_power",
	"1280000000": "currency",
	"25599999980": "information_rate",
	"25600000000": "information",
	"511999999980": "angular_velocity",
	"512000000000": "angle",
};

/**
 * Returns the list of available well-known kinds of units, e.g.
 * "radiation" or "length".
 *
 * @returns {UnitKind[]} names of kinds of units
 */
export function getKinds(): UnitKind[] {
	return uniq(Object.values(kindsMapping));
}

export function kind(this: Qty): UnitKind {
	return kindsMapping[this.signature.toString()];
}
