# Build Process

The Mac, Windows and Linux versions of Peerio can be built using `nwjs` (formerly `node-webkit`). 

To build, install Node.js and NPM. Within the root project directory, run `npm install`. Then, run `grunt build`. 


## Mac


## Windows


## Linux


# Additional (Internal) Tooling

To bump the version number to a patch version, run `grunt bump`.

Before doing releases, make sure to run `grunt update` to update dependencies and translation copy. 

Mac OS code signing can be done with `gulp sign`, provided the right Developer ID certificate is installed and configured as an environment variable. 
