/* Copyright (c) 2013 Richard Rodger */
"use strict";

var seneca = require('seneca')()


var plugins = {
  user: {},
  auth: {},

  'jsonrest-api': {},
  'engage': {},
  'cart': {},

  'jsonfile-store': {folder:'work'},
  'mongo-store': {connect:false},
  'level-store': {folder:'work'},

  'memcached': {},
  'vcache': {},
  'perm': {},

  // broken
  // 'sqlite-store': {database:'sqlite.db'},
  // 'redis-store':  {host:'localhost', port:12000},

  // bad: {}
}

var success = {}

for( var pn in plugins ) {
  try {
    console.log(pn)
    seneca.use( pn, plugins[pn], function(err){
      if( err ) {
        console.log('use-cb: '+err)
      }
      else {
        success[pn] = true
      }
    }) 
  }
  catch(e) {
    console.log('use-thrown: '+e)
    console.log(e.stack)
  }
}


seneca.ready(function(err){
  if( err ) {
    console.log('ready: '+err)
  }
  else {
    for( var pn in plugins ) {
      if( !success[pn] ) {
        console.log('FAIL: '+pn)
      }
    }
  }
})
