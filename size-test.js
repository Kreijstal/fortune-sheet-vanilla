const esbuild = require('esbuild');
const fs = require('fs');
try {
  esbuild.buildSync({
    entryPoints: ['lodash-test.mjs'],
    bundle: true,
    format: 'iife',
    outfile: 'lodash-test.out.js',
    minify: true,
    logLevel: 'silent',
  });
  const size = fs.statSync('lodash-test.out.js').size;
  console.log('namespace-import bundle size:', size, 'bytes');
  const out = fs.readFileSync('lodash-test.out.js', 'utf8');
  console.log('mentions sortBy:', out.includes('sortBy'), '| mentions cloneDeep:', out.includes('cloneDeep'));
} catch (e) {
  console.error('BUILD ERR:', e.message);
}
