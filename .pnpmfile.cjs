// Keep dependency resolution aligned with the reviewed tooling patches.
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === "listhen" && pkg.version === "1.10.1") {
        delete pkg.dependencies["node-forge"];
        pkg.dependencies["@peculiar/x509"] = "^2.1.0";
        pkg.dependencies["reflect-metadata"] = "^0.2.2";
      }
      if (pkg.name === "@next/eslint-plugin-next" && pkg.version === "16.3.8") {
        delete pkg.dependencies["fast-glob"];
        pkg.dependencies.tinyglobby = "^0.2.17";
      }
      if (
        (pkg.name === "fast-glob" && pkg.version === "3.3.3") ||
        (pkg.name === "globby" && pkg.version === "16.2.4") ||
        (pkg.name === "@parcel/watcher" && pkg.version === "2.5.1")
      ) {
        delete pkg.dependencies.micromatch;
        pkg.dependencies.picomatch = "^4.0.4";
        if (pkg.name === "fast-glob")
          pkg.dependencies["@isaacs/brace-expansion"] = "^5.0.1";
      }
      return pkg;
    },
  },
};
