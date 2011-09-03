#!/usr/bin/env node
// installation instruction if directly called
if (!process.env.JUMPPROFILE) {
  process.stdout.write([
    "###begin-jump-bash_profile",
    "#",
    "# Installation:",
    "# jump >> ~/.bash_profile && source ~/.bash_profile",
    "#",
    "",
    "function jump {",
    "  local newDir=$(JUMPPROFILE=1 command jump);",
    "  cd \"$newDir\";",
    "}",
    "alias j=\"jump\"",
    "",
    "###end-jump-bash_profile",
    ""
  ].join('\n'));
  process.exit();
}

var spawn  = require('child_process').spawn,
    charm = require('charm')(process.stdin, process.stderr),
    tty   = require('tty'),
    util  = require('util'),
    path  = require('path'),
    homePath  = process.env.HOME;

// wrapper around mdfind, searches for directories and filters results
var find = (function(){
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

var Suggestions = function(number){
  this.defaults = true;
  this.selected = 0;
  this.number   = number || 5;
}
util.inherits(Suggestions, Array);

Suggestions.prototype.update = function(newSuggestions){
  if (!this.defaults) {
    this.selected = newSuggestions.indexOf(this[this.selected]);
    if (this.selected==-1 || this.selected > 5) {
      this.defaults = true;
      this.selected = 0;
    }
  }
  var i=0;
  for(;i<newSuggestions.length;i++) this[i] = newSuggestions[i];
  for(;i<this.length;i++) delete this[i];
  this.length = newSuggestions.length;
  this.render();
};

Suggestions.prototype.selectPrevious = function(){
  if (this.selected>0){
    this.defaults=false;
    this.selected--;
  }
  this.render();
};

Suggestions.prototype.selectNext = function(){
  if (this.selected<this.number && this.selected<this.length-1){
    this.defaults=false;
    this.selected++;
  }
  this.render();
};

Suggestions.prototype.output = function(){
  if (this[this.selected]){
    charm.write('cd "'+this[this.selected]+'"\n');
    process.stdout.write(this[this.selected]);
  }
};

Suggestions.prototype.highlight = function(idx){
  return (this.defaults && idx == 0)||(idx == this.selected);
};

Suggestions.prototype.render = function(){
  var size  = tty.getWindowSize(), 
      lines = size[0], 
      cols  = size[1],
      idx   = 0;

  charm.position(function(x,y){
    charm.cursor(false);
    for(;idx<Math.min(this.number, this.length); idx++){
      if (y+idx >= lines){
        charm.position(cols, lines).write('\n');
        y--;
      }
      if (this.highlight(idx)) charm.foreground('yellow');
      charm.position(0,y+idx+1)
           .erase('end')
           .write(this[idx].replace(homePath, '~'));
      if (this.highlight(idx)) charm.display('reset');
    }
    for(;y+idx<lines;idx++) charm.position(0,y+idx+1).erase('line');
    charm.position(x,y).cursor(true);
  }.bind(this));
};

var buffer      = [];
var suggestions = new Suggestions;

process.stdin.resume();
process.stdin.on('keypress', function(char, key) {
  charm.position(function(x,y){
    if (key && key.name == 'up'){
      suggestions.selectPrevious();
    } else if (key && key.name == 'down'){
      suggestions.selectNext();
    } else if (key && key.name == 'left'){
      if (x>1) charm.left();
    } else if (key && key.name == 'right'){
      if (x<=buffer.length) charm.right();
    } else if (key && key.ctrl && key.name == 'a'){
      charm.position(0,y);
    } else if (key && key.ctrl && key.name == 'e'){
      charm.position(1+buffer.length, y);
    } else if (key && (key.name == "enter" || (key.ctrl && key.name == 'c'))){
      charm.cursor(false);
      for (var idx=y; idx<tty.getWindowSize()[0]; idx++) charm.position(0,idx).erase('line');
      charm.position(0,y);
      if (key.name == "enter") suggestions.output();
      charm.cursor(true);
      process.exit();
    } else if (!key || !key.ctrl){
      charm.cursor(false);
      var right=[];
      if (key && key.name == 'backspace'){
        if (x>1){          
          right = buffer.slice(x-1);
          buffer.length=x-2;
          buffer.push.apply(buffer, right);
          charm.position(--x, y);
        }
      } else if (typeof char != "undefined"){
        buffer.splice(x-1, 0, char);
        right = buffer.slice((x++)-1);
      }
      charm.erase('end').write(right.join('')).position(x,y).cursor(true);
      find(buffer.join(''), suggestions.update.bind(suggestions));
    }
  })
});