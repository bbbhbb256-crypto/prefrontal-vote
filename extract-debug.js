var fs = require('fs');
var html = fs.readFileSync('F:/changbai-finance/demo/担保保险-工作台.html', 'utf8');
var match = html.match(/<script src="shared-data\.js"><\/script>\s*<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (match) {
  var script = match[1];
  // Check for embedded script tags
  var count = (script.match(/<\/script>/g) || []).length;
  console.log('Script length:', script.length);
  console.log('</script> occurrences:', count);
  console.log('First 100 chars:', JSON.stringify(script.substring(0, 100)));
  console.log('Last 100 chars:', JSON.stringify(script.substring(script.length - 100)));
  // Save to file
  fs.writeFileSync('F:/changbai-finance/demo/extracted-guarantee.js', script, 'utf8');
  console.log('Saved to extracted-guarantee.js');
} else {
  console.log('No match found');
}
