#!/bin/bash

closure-compiler --compilation_level BUNDLE --js ./src/*.js --js_output_file script.debug.min.js
closure-compiler --js ./src/*.js --js_output_file script.min.js