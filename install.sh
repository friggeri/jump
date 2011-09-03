cat <<"EOF" >>~/.bash_profile

#### automatically added by jump
function j {
  newdir="$(jump)";
  echo cd $newdir;
  cd "$newdir";
}
EOF
source ~/.bash_profile