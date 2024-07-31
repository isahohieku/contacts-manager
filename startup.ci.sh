#!/bin/bash
npm run start:prod > /dev/null 2>&1 &
/opt/wait-for-it.sh maildev:1080
/opt/wait-for-it.sh localhost:3000 -- yarn run test:e2e:cov
