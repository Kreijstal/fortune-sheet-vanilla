import * as formulajsNs from '@formulajs/formulajs';

// esm.sh (and Node ESM interop) expose the ~450 formula functions on the
// namespace's `default` (CJS module.exports), while bundlers like esbuild
// expose them as named exports. Pick whichever shape actually has them.
const formulajs =
  formulajsNs.default &&
  Object.keys(formulajsNs.default).length >= Object.keys(formulajsNs).length
    ? formulajsNs.default
    : formulajsNs;

const SUPPORTED_FORMULAS = Object.keys(formulajs);

export default SUPPORTED_FORMULAS;
