#!/bin/bash
/opt/wait-for-it.sh postgres:5432 -- yarn run migration:run && yarn run seed:run
/opt/wait-for-it.sh maildev:1080
/opt/wait-for-it.sh localhost:3000 -- yarn run test:e2e:cov
