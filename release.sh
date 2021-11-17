#!/bin/sh

set -xe

npm run build
echo 'console.log("Load site config");' >public/config.js
tar -C public -cJf jmapweb.tar.xz .

