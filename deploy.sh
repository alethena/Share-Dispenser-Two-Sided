#!/bin/bash
# My first script

cd ng 
npm install
ng build --prod --aot
/Users/benjaminrickenbacher/.anaconda/navigator/a.tool
exit
aws s3 rm s3://dispenser.alethena.com --recursive
aws s3 cp ./dist/ s3://dispenser.alethena.com --recursive