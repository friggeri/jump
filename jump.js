#!/usr/bin/env node
// installation instruction if directly called
if (!process.env.JUMPPROFILE) {
  process.stdout.write([
    "###begin-jump-bash_profile",
    "#",
    "# Installation:",
    "#",
    "# jump >> ~/.bash_profile && source ~/.bash_profile",
    "#",
    "",
    "function jump {",
    "  local si=\"$IFS\";",
    "  IFS=$'\\n';",
    "  local newDir=$(JUMPPROFILE=1 command jump \"$@\");",
    "  cd \"$newDir\";",
    "  IFS=\"$si\";",
    "}",
    "alias j=\"jump -a\"",
    "",
    "###end-jump-bash_profile",
    ""
  ].join('\n'));
  process.exit();
}

// commander uses process.stdout by default, let's invert stdout and stderr
var stdout = process.stdout, stderr = process.stderr;
Object.defineProperty(process, 'stdout', {get:function(){return stderr;}});
Object.defineProperty(process, 'stderr', {get:function(){return stdout;}});

var charm       = require('charm')({stdin:process.stdin, stdout:process.stdout})
    Suggestions = require('./lib/suggestions')(charm),
    find        = require('./lib/find').find,
    tty         = require('tty'),
    opts        = require('commander')
    readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout);;

// parse options
opts
  .version('0.0.5')
  .option('-n --number <n>', 'number of suggestions', Number, 5)
  .option('-v --verbose', 'print cd command', false)
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
  for (var idx=y; idx<=process.stdout.getWindowSize()[0]; idx++) charm.position(0,idx).erase('line');
  charm.position(0,y);
  charm.cursor(true);
  if (output) {
    if(opts.verbose) charm.write('cd "'+output+'"\n');
    process.stderr.write(output);
  }
  process.nextTick(function(){
    process.exit();
  });
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
  rl.setPrompt(prompt, 2);
  rl.on('SIGINT', function(){
    charm.position(function(x,y){
      exit(x,y,null);
    })
  })
  rl.input.on('keypress', function(chr, key) {
    charm.position(function(x,y){
      x = x - prompt.length;
      if (key && (key.name == 'up' || (key.ctrl && key.name == 'p'))){
        suggestions.selectPrevious();
      } else if (key && (key.name == 'down' || (key.ctrl && key.name == 'n'))){
        suggestions.selectNext();
      } else if (key && (key.name == 'left' || (key.ctrl && key.name == 'b'))){
        // ignore
      } else if (key && (key.name == 'right' || (key.ctrl && key.name == 'f'))){
        // ignore
      } else if (key && key.ctrl && key.name == 'a'){
        charm.position(1+prompt.length,y);
      } else if (key && key.ctrl && key.name == 'e'){
        charm.position(1+prompt.length+buffer.length, y);
      } else if (key && (key.name == "enter" || (key.ctrl && (key.name == 'd')))){
        exit(x,y,key.name=="enter"?suggestions.get():null);
      } else if (!key || !key.ctrl){
        charm.cursor(false);
        var right=[];
        if (key && key.name == 'backspace'){
          if (x>0){
            right = buffer.slice(x);
            buffer.length=x-1;
            buffer.push.apply(buffer, right);
            charm.position(x+prompt.length, y);
          } else {
            right = buffer.slice(0);
          }
        } else if (typeof chr != "undefined"){
          buffer.splice(x-1, 0, chr);
          right = buffer.slice(x-1);
        }
        charm.erase('end').write(right.join('')).position(prompt.length + x,y).cursor(true);
        find(buffer.join(''), function(res){
          suggestions.update(res);
          suggestions.render(function(){
            if (opts.auto && res.length==1) exit(x,y,suggestions.get());
          });
        });
      }
    })
  });
  rl.prompt();
}
