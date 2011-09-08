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
    "  local newDir=$(JUMPPROFILE=1 command jump \"$@\");",
    "  cd \"$newDir\";",
    "}",
    "alias j=\"jump -a\"",
    "",
    "###end-jump-bash_profile",
    ""
  ].join('\n'));
  process.exit();
}

// commander uses process.stdout by default, let's invert stdout and stderr
var tmpOut = process.stdout; process.stdout = process.stderr; process.stderr = tmpOut;

var charm       = require('charm')(process.stdin, process.stdout)
    Suggestions = require('./lib/suggestions')(charm),
    find        = require('./lib/find').find,
    tty         = require('tty'),
    opts        = require('commander');

// parse options
opts
  .version('0.0.5')
  .option('-n --number <n>', 'number of suggestions', Number, 5)
  .option('-a --auto', 'automatically cd if there is only one result', false)
  .on('--help', function(){
    charm.write('  Non interactive:\n')
    charm.write('\n');
    charm.write('    Typing a query in the command will automatically cd to the first result, eg.\n');
    charm.write('\n');
    charm.write('    jump [query]\n');
    charm.write('\n');
  })
  .parse(process.argv)


// cleanup function
var exit = function(x, y, output){
  charm.cursor(false);
  for (var idx=y; idx<=tty.getWindowSize()[0]; idx++) charm.position(0,idx).erase('line');
  charm.position(0,y);
  if (output) {
    charm.write('cd "'+output+'"\n');
    process.stderr.write(output);
  }
  charm.cursor(true);
  process.exit();
}

var suggestions = new Suggestions(opts.number);
if (opts.args.length){
  // if a query is given as an argument, jump to the first result
  find(opts.args.join(' '), function(res){
    charm.position(function(x,y){
      suggestions.update(res);
      exit(x,y,suggestions.get());
    });
  });
} else {
  // start the repl
  var buffer = [];
  var prompt = '> ';
  charm.write(prompt);
  process.stdin.resume();
  process.stdin.on('keypress', function(chr, key) {
    charm.position(function(x,y){
      x = x - prompt.length;
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
        exit(x,y,key.name=="enter"?suggestions.get():null);
      } else if (!key || !key.ctrl){
        charm.cursor(false);
        var right=[];
        if (key && key.name == 'backspace'){
          if (x>1){
            right = buffer.slice(x-1);
            buffer.length=x-2;
            buffer.push.apply(buffer, right);
            charm.position(--x+prompt.length, y);
          }
        } else if (typeof chr != "undefined"){
          buffer.splice(x-1, 0, chr);
          right = buffer.slice((x++)-1);
        }
        charm.erase('end').write(right.join('')).position(prompt.length + x,y).cursor(true);
        find(buffer.join(''), function(res){
          suggestions.update(res);
          if (opts.auto && res.length==1) exit(x,y,suggestions.get());
        });
      }
    })
  });
}
