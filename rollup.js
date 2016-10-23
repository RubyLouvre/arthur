var rollup = require( 'rollup' );
var fs = require( 'fs' );
var istanbul = require('rollup-plugin-istanbul');
//var babel = require('rollup-plugin-babel');
var babel = require("babel-core");

var transform = require('es3ify').transform;

// used to track the cache for subsequent bundles
var cache;

rollup.rollup({
  // The bundle's starting point. This file will be
  // included, along with the minimum necessary code
  // from its dependencies
  entry: 'src/aaa.js',
  // If you have a bundle you want to re-use (e.g., when using a watcher to rebuild as files change),
  // you can tell rollup use a previous bundle as its starting point.
  // This is entirely optional!
  cache: cache,
  
  plugins: [
//    istanbul({
//      
//      exclude: ['test/**/*.js']
//    }),
  ]
}).then( function ( bundle ) {
  // Generate bundle + sourcemap
  var result = bundle.generate({
      format: 'umd',
      moduleName: 'avalon'
  });
  // Cache our bundle for later use (optional)
  cache = bundle;
  result.code = result.code.replace( 
          /Object\.defineProperty\(exports,\s*'__esModule',\s*\{\s*value:\s*true\s*\}\);/,
          "exports.__esModule = true" ).
                  replace(/'use strict';?/,'')
                  
  result = babel.transform(result.code, {
      presets: ['es2015-loose', 'stage-0']
  })
  
  var code = transform(result.code).replace(/\}\)\(undefined,/,'})(this,')
  fs.writeFileSync( './dist/index.js', code );

}).catch(function(e){
   console.log('error',e)
})