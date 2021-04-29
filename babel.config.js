module.exports = {
	// Disable searching for configuration files relative to the "filename" provided to Babel
	babelrc: false,

	presets: [
		["@babel/preset-env", { modules: "commonjs", targets: { node: "current" } }],
		"@babel/preset-typescript",
	],
};
