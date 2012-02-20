var util = require('util');

module.exports = function(charm){
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
  };

  var cycle = function(dir){
    return function(){
      var mod  = Math.min(this.number, this.length);
      var step = (mod + dir) % mod;
      this.defaults=false;
      this.selected=(this.selected+step)%mod;
      this.render();
    }
  }
  Suggestions.prototype.selectPrevious = cycle(-1);
  Suggestions.prototype.selectNext     = cycle(+1);

  Suggestions.prototype.get = function(){
    return this[this.selected];
  }

  Suggestions.prototype.highlight = function(idx){
    return (this.defaults && idx == 0)||(idx == this.selected);
  };

  Suggestions.prototype.render = function(callback){
    var size  = process.stdout.getWindowSize(), 
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
             .write(this[idx].replace(process.env.HOME, '~'));
        if (this.highlight(idx)) charm.display('reset');
      }
      for(;y+idx<lines;idx++) charm.position(0,y+idx+1).erase('line');
      charm.position(x,y).cursor(true);
      if (callback) callback();
    }.bind(this));
  };
  
  return Suggestions;
}