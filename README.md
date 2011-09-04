#Installation

    npm -g install jump
    jump >> ~/.bash_profile
    source ~/.bash_profile

#Usage

Pretty simple, `jump` is aliased to `j` :

    j

Type a few letters, `jump` autosuggests 5 results, move with arrows, return to select.

`jump` also supports a few options:

    jump [options]

      Options:

        -h, --help       output usage information
        -v, --version    output the version number
        -n --number <n>  number of suggestions
        -a --auto        automatically change directory if only one suggestion
    

`jump` uses spotlight (`mdfind`) behind the scenes, probably won't work on anything but osx.


#TODO

Sort by usage would be nice.

#License
Copyright (C) 2011 by Adrien Friggeri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.