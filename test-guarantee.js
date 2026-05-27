// Mock DOM
globalThis.document = {
  getElementById: function(id) {
    if (id === 'main') return { innerHTML: '', _c: null };
    if (id === 'toast') return { textContent: '', className: '', classList: { add: function(){}, remove: function(){} } };
    return null;
  },
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  createElement: function() { return {}; },
  addEventListener: function() {}
};
globalThis.window = globalThis;
globalThis.location = { href: '', reload: function(){} };
globalThis.localStorage = { getItem: function(){ return null; }, setItem: function(){}, removeItem: function(){} };
globalThis.BroadcastChannel = function() { this.postMessage = function(){}; this.onmessage = null; };
globalThis.echarts = { init: function() { return { setOption: function(){} }; }, graphic: { LinearGradient: function() {} } };

var fs = require('fs');

// Load shared-data.js via eval
var sharedJS = fs.readFileSync('F:/changbai-finance/demo/shared-data.js', 'utf8');
eval(sharedJS);
console.log('shared-data.js loaded, $S.type:', typeof $S);

// Load guarantee page inline script
var html = fs.readFileSync('F:/changbai-finance/demo/担保保险-工作台.html', 'utf8');
var match = html.match(/<script src="shared-data\.js"><\/script>\s*<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (match) {
  try {
    eval(match[1]);
    console.log('SUCCESS: Script executed without errors');
  } catch(e) {
    console.log('ERROR:', e.message);
    console.log('Line:', e.lineNumber || 'unknown');
  }
} else {
  console.log('FAILED to extract inline script');
}
