#!/bin/bash

sed -i "s/ID_TOKEN_VALUE/${ID_TOKEN}/g" "/usr/share/nginx/html/index.html"
nginx -g 'daemon off;'
