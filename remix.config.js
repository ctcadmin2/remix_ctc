/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "cjs",
  sourceMaps: true,
  postcss: true,
  serverDependenciesToBundle: [
		/^remix-utils.*/,
  ]
};
