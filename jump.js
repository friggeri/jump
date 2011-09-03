#!/usr/bin/env node
var exec  = require('child_process').exec,
    charm = require('charm')(process.stdin, process.stderr),
    tty   = require('tty');

var find = function(name, search, cb){
  cb || (cb = search, search = 'mdfind "kMDItemContentType == \'public.folder\' && kMDItemDisplayName == \'*%name*\'wcd"');
  exec(search.replace(/([^\\])%name/, "$1"+name), function(error, stdout, stderr){
    if (error) return cb(error);
    cb(null, stdout.split('\n').filter(function(e){return e.length}))
  });
};

var buffer          = [];
var counter         = 0;
var dirtyLines      = {};
var toErase         = 0;
var selected        = null;
var selectedPos     = 1;
var lastSuggestions = [];

process.stdin.resume();
process.stdin.on('keypress', function(char, key) {
  //console.log(char, key);
  var size = tty.getWindowSize(), lines=size[0], cols=size[1];
  charm.position(function(x,y){
    if (key && key.name == 'up'){
      if (selectedPos>1){
        charm.cursor(false);
        charm.position(0,y+selectedPos);
        charm.write(" ");
        
        selectedPos-=1;
        charm.position(0,y+selectedPos);
        charm.write(">");
        selected=lastSuggestions[selectedPos-1];
        
        charm.position(x,y);
        charm.cursor(true);
      }
    } else if (key && key.name == 'down'){
      if (selectedPos<5 && selectedPos<lastSuggestions.length){
        charm.cursor(false);
        charm.position(0,y+selectedPos);
        charm.write(" ");
        
        selectedPos+=1;
        charm.position(0,y+selectedPos);
        charm.write(">");
        selected=lastSuggestions[selectedPos-1];
        
        charm.position(x,y);
        charm.cursor(true);
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
      for (var line in dirtyLines){
        if (dirtyLines[line]){
          charm.position(0,parseInt(line, 10)+y);
          charm.erase('line')
        }
      }
      charm.position(0,y);
      charm.erase('line');
      if (key.name == "enter"){
        charm.position(0,y);
        process.stdout.write((selected||lastSuggestions[0]));
      }
      process.exit();
    } else {
      charm.cursor(false);
      var newX = x;
      if (key && key.name == 'backspace'){
        if (x>1){          
          var rest = buffer.slice(x-1);
          buffer.length=x-2;
          buffer.push.apply(buffer, rest);
          charm.position(--x, y);
          newX--;
        }
      } else if (typeof char != "undefined"){
        buffer.splice(x-1, 0, char);
        newX++;
      }
      
      charm.erase('end');
      charm.write(buffer.slice(x-1).join(''));
      charm.position(newX,y);
      
      charm.cursor(true);
      
      (function(current){
        find(buffer.join(''), function(err, suggestions){
          if (current != counter) return;
          if (err) suggestions=[];
          
          var newErase = 0;
          
          charm.cursor(false);
          
          if ((selectedPos = 1+suggestions.indexOf(selected)) == 0 || selectedPos > 5){
            selected=null;
            selectedPos=1;
          }
          
          lastSuggestions = suggestions;
          
          for(var i=1; i<=5; i++){
            if (i<= suggestions.length){
              if (y+i > lines){
                charm.position(cols, lines);
                y--;
                charm.write('\n');
              }
              charm.position(0,y+i);
              charm.erase('end');
              dirtyLines[i] = true;
              charm.write((i==selectedPos?'> ':'  ')+suggestions[i-1].replace(process.env.HOME, '~'));
            } else {
              if (y+i<=lines){
                charm.position(0,y+i);
                charm.erase('end');
                dirtyLines[i] = false;
              }
            }
          }
          
          charm.position(newX,y);
          charm.cursor(true);
      });
    })(++counter);
    }
  })
});