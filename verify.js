/* Copyright (c) 2013 Richard Rodger */
"use strict";

var seneca = require('seneca')({log:'print'})
var _ = require('underscore')
var async = require('async')
var basic_store = require('./test/store/basic_store.js')

var plugins = {/*
  user:         {},
  auth:         {},
  'jsonrest-api':{},
  mail:         {templates:false},
  'postmark-mail':{},
  engage:       {},
  cart:         {},
  account:      {},
  project:      {},
  perm:         {},
  'data-editor':{testSuite: ['defaultStoreTest']},*/
  'seneca-mongo-store':{
    name:'seneca',
    host:'paulo.mongohq.com',
    port:10040,
    username: 'seneca',
    password: 'verify',
    options:{
      // uncomment to test
      // native_parser:true
    },
    testSuite:['defaultStoreTest']
  }
}

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
  testSuite[currentTestSuite](pn, currentTestSuite, function(err){
    if (err){
      addFailed(pn, currentTestSuite)
    }else{
      addSuccess(pn, currentTestSuite)
    }
    done()
  })
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
  console.log('Fire: ' + currentTestSuite + ' for ' + pn)
  try{
    basic_store.basictest(seneca, done)
  }catch(err){
    console.error('Error when running ' + currentTestSuite + ' on ' + pn)
    addFailed(pn, currentTestSuite)
    done(err)
  }
}

var testSuite = {
  defaultStoreTest: defaultStoreTest
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
      if (plugin.testSuite && _.isArray(plugin.testSuite)){
        for (var i = 0; i < plugin.testSuite.length; i++){
          currentTestSuite = plugin.testSuite[i]

          tests[currentTestSuite] = function(done){
            runTest(pn, currentTestSuite, done)
          }
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
}

process.on('uncaughtException', function (err) {
  console.error('Abort execution. Exception occurred: ' + err);
  addFailed(pn, currentTestSuite)
  printReport()
})
