// wrapper around mdfind, searches for directories and filters results
var spawn  = require('child_process').spawn,
    path   = require('path');

var homePath = process.env.HOME;

exports.find = (function(){
  var counter = 0,
      inHome    = new RegExp("^"+homePath.replace(/\//g, '\\/')),
      inLibrary = new RegExp("^"+path.join(homePath, 'Library').replace(/\//g, '\\/'));
  
  return function(name, cb){
    var query   = 'kMDItemContentType == "public.folder" && kMDItemDisplayName == "*%name*"wcd'.replace(/([^\\])%name/, "$1"+name),
        child   = spawn('mdfind', [query]),
        buffer  = [],
        current = ++counter;
    child.on('exit', function(){
      if (current == counter) cb(buffer.join('\n').split('\n').filter(function(e){
        return e.length && e.match(inHome) && !e.match(inLibrary)
      }));
    }).stdout.on('data', [].push.bind(buffer));
  }
})();