#!/usr/bin/env node
var spawn  = require('child_process').spawn,
    charm = require('charm')(process.stdin, process.stderr),
    tty   = require('tty');

var find = function(name, cb){
  var query  = 'kMDItemContentType == "public.folder" && kMDItemDisplayName == "*%name*"wcd'.replace(/([^\\])%name/, "$1"+name),
      child  = spawn('mdfind', [query]),
      buffer = [];
  child.stdout.on('data', [].push.bind(buffer));
  child.on('exit', function(){
    cb(null, buffer.join('\n').split('\n').filter(function(e){return e.length}))
  })
};

var buffer          = [];
var counter         = 0;
var toErase         = 0;
var selected        = null;
var selectedPos     = 1;
var lastSuggestions = [];

var refreshResults = function(suggestions){
  var size = tty.getWindowSize(), lines=size[0], cols=size[1];
  charm.position(function(x,y){
    charm.cursor(false);
    
    if ((selectedPos = 1+suggestions.indexOf(selected)) == 0 || selectedPos > 5){
      selected=null;
      selectedPos=1;
    }
    
    lastSuggestions = suggestions;
    
    toErase=0;
    for(var i=1; i<=5; i++){
      if (i<= suggestions.length){
        if (y+i > lines){
          charm.position(cols, lines);
          y--;
          charm.write('\n');
        }
        toErase++;
        charm.position(0,y+i);
        charm.erase('end');

        if (i==selectedPos) charm.display('reverse');

        charm.write(suggestions[i-1].replace(process.env.HOME, '~'));
        charm.display('reset');
      } else {
        if (y+i<=lines){
          charm.position(0,y+i);
          charm.erase('end');
        }
      }
    }
    
    charm.position(x,y);
    charm.cursor(true);
  });
};

process.stdin.resume();
process.stdin.on('keypress', function(char, key) {
  //console.log(char, key);
  charm.position(function(x,y){
    if (key && key.name == 'up'){
      if (selectedPos>1){
        selected=lastSuggestions[(--selectedPos)-1];
        refreshResults(lastSuggestions);
      }
    } else if (key && key.name == 'down'){
      if (selectedPos<5 && selectedPos<lastSuggestions.length){
        selected=lastSuggestions[(++selectedPos)-1];
        refreshResults(lastSuggestions);
      }
    } else if (key && key.name == 'left'){
      if (x>1) charm.left();
    } else if (key && key.name == 'right'){
      if (x<=buffer.length) charm.right();
    } else if (key && key.ctrl && key.name == 'a'){
      charm.position(0,y);
    } else if (key && key.ctrl && key.name == 'e'){
      charm.position(1+buffer.length, y);
    } else if (key && (key.name == "enter" || (key.ctrl && key.name == 'c'))){
      for (var line=0; line<=toErase; line++){
        charm.position(0,y+line);
        charm.erase('line');
      }
      charm.position(0,y);
      if (key.name == "enter"){
        var dir = selected||lastSuggestions[0];
        if (dir){
          charm.write('cd "'+dir+'"\n');
          process.stdout.write(dir);
        }
      }
      process.exit();
    } else {
      charm.cursor(false);
      
      var rest=[];
      if (key && key.name == 'backspace'){
        if (x>1){          
          rest = buffer.slice(x-1);
          buffer.length=x-2;
          buffer.push.apply(buffer, rest);
          charm.position(--x, y);
        }
      } else if (typeof char != "undefined"){
        buffer.splice(x-1, 0, char);
        rest = buffer.slice(x-1);
        x++;
      }
      
      charm.erase('end');
      charm.write(rest.join(''));
      charm.position(x,y);
      
      charm.cursor(true);
      
      (function(current){
        find(buffer.join(''), function(err, suggestions){
          if (current == counter) refreshResults(err?[]:suggestions);
        });
      })(++counter)
    }
  })
});