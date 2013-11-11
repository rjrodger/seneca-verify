/* Copyright (c) 2013 Richard Rodger */
"use strict";

var seneca = require('seneca')({log:'print'})
var _ = require('underscore')
var async = require('async')

var plugins = require('./config/credentials.js')

var success = {}
var fail = {}
var pn
var currentTestSuite

for( pn in plugins ) {
  try {
    var plugin = plugins[pn]
    console.log('Loading plugin: ' + pn)
    seneca.use( pn, plugin, function(err){
      if( err ) {
        console.log('load plugin error: ' + err)
        fail[pn]=['load']
      }
      else {
        success[pn] = ['load']
      }
    })
  }
  catch(e) {
    console.log('use-thrown: ' + e)
    console.log(e.stack)
    fail[pn]=['load']
  }
}

function runTest(pn, currentTestSuite, done){
  console.log('Fire: ' + currentTestSuite + ' for ' + pn)
  try{
    testSuite[currentTestSuite](pn, currentTestSuite, function(err){
      if (err){
        addFailed(pn, currentTestSuite)
      }else{
        addSuccess(pn, currentTestSuite)
      }
      done()
    })
  }catch(err){
    console.error('Error when running ' + currentTestSuite + ' on ' + pn)
    addFailed(pn, currentTestSuite)
    done(err)
  }
}

function addFailed(pn, testSuite){
  if (!fail[pn]){
    fail[pn] = []
  }
  fail[pn].push(testSuite)
}

function addSuccess(pn, test){
  if (!success[pn]){
    success[pn] = []
  }
  success[pn].push(test)
}

var defaultStoreTest = function (pn, currentTestSuite, done){
  require('./test/store/basic_store.js').basictest(seneca, plugins[pn], done)
}

var sqlStoreTest = function (pn, currentTestSuite, done){
  require('./test/store/basic_store.js').sqltest(seneca, plugins[pn], done)
}

var testSuite = {
  defaultStoreTest: defaultStoreTest,
  sqlStoreTest    : sqlStoreTest
}

seneca.ready(function(err){
  if( err ) {
    console.log('Seneca ready error: ' + err)
  }
  else {
    console.log('Seneca is ready')

    var tests = {}
    for( pn in plugins ) {
      // run now tests depending on the current plugin
      plugin = plugins[pn]
      if (plugin.testSuite && _.isArray(plugin.testSuite)){
        if (!success[pn]){
          continue;
        }
        for (var i = 0; i < plugin.testSuite.length; i++){
          currentTestSuite = plugin.testSuite[i]
          tests[pn + ':' + currentTestSuite] = runTest.bind(null, pn, currentTestSuite)
        }
      }
    }
    async.series(tests, function(err, out){
      printReport()
    })
  }
})


function printReport(){
  console.log('==============================================================')
  console.log('Report:')
  console.log('==============================================================')
  for( var pn in plugins ) {
    if (success[pn]){
      console.log('Success', pn, success[pn])
    }
    if (fail[pn]){
      console.error('Fail', pn, fail[pn])
    }
  }
  console.log('==============================================================')
  console.log('==============================================================')
  seneca.close()
  process.exit(0)
}

process.on('uncaughtException', function (err) {
  console.error('Abort execution. Exception occurred: ' + err);
  addFailed(pn, currentTestSuite)
  printReport()
})
