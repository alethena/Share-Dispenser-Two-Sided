#!/bin/bash
# My first script

cd Solidity 
npm install
truffle compile
cd ..
cd ng
npm install
ng serve