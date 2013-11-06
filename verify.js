/* Copyright (c) 2013 Richard Rodger */
"use strict";

var seneca = require('seneca')()
var _ = require('underscore')

var plugins = {
  user: {},
  auth: {},
  'jsonrest-api': {},
  'mail': {templates:false},
  'postmark-mail': {},
  'engage': {},
  'cart': {},
  'account': {},
  'project': {},
  'perm': {},
  'data-editor': {},
  'mongo-store': {testSuite: ['defaultStoreTest']}
}

var success = {}
var fail = {}

for( var pn in plugins ) {
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


seneca.ready(function(err){
  if( err ) {
    console.log('Seneca ready error: ' + err)
  }
  else {
    console.log('Seneca is ready')

    for( var pn in plugins ) {
      // run now tests depending on the current plugin
      if (plugin.testSuite && _.isArray(plugin.testSuite)){
        for (var i = 0; i < plugin.testSuite.length; i++){
          var currentTestSuite = plugin.testSuite[i]
          try {
            var test = new Function(currentTestSuite)
            test()
          }
          catch(e) {
            if (!fail[pn]){
              fail[pn] = []
            }
            fail[pn].push(currentTestSuite)
          }
        }
      }
    }

    printReport()
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
  printReport()
})
