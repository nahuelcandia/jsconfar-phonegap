#!/usr/bin/env node

var cordova = require('cordova-lib').cordova;
var fs = require('fs');
var path = require('path');

var projectRoot = appRootPath = '.';
var force = process.argv[2] == "--force";
var report = process.argv[2] == "--inspect";
var normal = process.argv[2] == "--normal";
if(process.argv.length !== 3 || process.argv[2] === "--help") {
  console.log("Usage: node reinstallPlugins.js --[MODE]");
  console.log("Modes:");
  console.log("  --normal: tries to remove every plugin found and reinstall it");
  console.log("  --inspect: will report found plugins but will do nothing");
  console.log("  --force: forces installation even if plugin removal fails");
  console.log(" ");
  console.log("Word of advice: every plugin found on project root (where this script is)");
  console.log("will be installed via local directory. Keep this in mind if you want to:");
  console.log("  - avoid installing from org.apache.cordova registry (local installs take precedence!)");
  console.log("  - stick to a specific version of a plugin (keep it local)");
  console.log("  - want to install third party plugins (not from plugins registry)");
  process.exit();
}

// addIosPlatform(projectRoot, function(err, appRootPath){
//   console.log('reinstalling...');
//   reInstallPlugins(appRootPath, function(err, resultPath){
//     console.log('all done');
//   })
// });

reInstallPlugins(appRootPath, function(err, resultPath){
  if(err) console.error(err);
  console.log('all done');
});

/**
 *
 */
function reInstallPlugins (appPath, callback) {
  var originalCWD = process.cwd();
  fs.readFile(path.join(appPath,'plugins','ios.json'), function(err, data) {
    console.log('Reading plugins/ios.json');
    if(err) {
      console.log('Error reading plugins.json');
      callback(err);
      return;
    }
    //get plugins from fqcn directories at project root with a 'plugin.xml' inside
    console.log('Reading plugins from root path dirs...');
    var pluginsDirs = fs.readdirSync(appPath).filter(function getPluginsDirs(e){
      //check for fqcn-style dirs with a 'plugin.xml' inside them
      return e.split('.').length > 2 && fs.existsSync(path.join(appPath,e,'plugin.xml'));
    });
    console.log('Plugins found on project root path: ')
    console.log(pluginsDirs);

    console.log('Reading plugins from plugins path...');
    var pluginsInPluginsDir = fs.readdirSync(path.join(appPath,'plugins')).filter(function getPluginsInDir(e){
      //check for fqcn-style dirs with a 'plugin.xml' inside them
      // console.log(e);
      // console.log("Seems like reversed DNS path:",e.split(".").length > 2);
      // console.log("Has plugin.xml inside("+path.join(appPath,'plugins',e,'plugin.xml')+"):",fs.existsSync(path.join(appPath,e,'plugin.xml')));
      return e.split('.').length > 2 && fs.existsSync(path.join(appPath,'plugins',e,'plugin.xml'));
    });
    console.log('Plugins found on plugins dir: ');
    console.log(pluginsInPluginsDir);

    var pluginsJson = JSON.parse(data);
    console.log('Plugins found on plugins/json: ');
    console.log(Object.keys(pluginsJson.installed_plugins));

    //remove duplicates from concat (dirs and installed_plugins)
    var plugs = arrayUnique(
      Object.keys(pluginsJson.installed_plugins).concat(pluginsDirs).concat(pluginsInPluginsDir))
    //then filter which ever is a dependant plugin
    .filter(function(e){
      return Object.keys(pluginsJson.dependent_plugins).indexOf(e) === -1;
    });

    console.log('Will remove and reinstall these plugins:',plugs);
    // return false;

    //if no plugins are present, just move on
    if(plugs.length < 1) {
      console.log('No plugins to remove/install');
      return callback();
    }
    
    if(report) {
      console.log("Script called with --inspect, aborting");
      callback();
      return;
    }
    process.chdir(appPath);
    cordova.plugin('rm',plugs, function(e){
      if(e) {
        console.log('Error removing plugins from project');
        console.log(plugs);
        if(!force) {
          process.chdir(originalCWD);
          callback(e);
          return;
        }
        console.log('Error removing plugins, but --force implemented, continuing');
      }
      if(!e) console.log('Plugins removed succesfully');
      // return false;
      cordova.plugin('add', plugs, function(e) {
        process.chdir(originalCWD);
        if(e) {
          console.log('Error installing plugins');
          callback(e);
          return;
        }
        console.log('Plugins reinstalled succesfully');
        callback();
      });
    });
  });
}
/**
 * Adds android platform to phonegap project
 * @param {String} projectDir Phonegap project directory
 * @param {Function} callback captain obvious
 *   - {Error} err Null if process exited with code 0
 */
function addIosPlatform(projectDir, callback) {
  console.log('Adding iOS platform to template project');
  var originalCWD = process.cwd();
  console.log('Changing working directory to ', projectDir);
  process.chdir(projectDir);

  cordova.platform('add',['ios'], function(err){
    process.chdir(originalCWD);
    console.log('Changing CWD back to process');
    if(err){
      console.log('Cordova error');
      callback(err);
      return;
    }
    console.log('iOS platform added on ' + projectDir);
    callback(null, projectDir);
  });
}

/**
 * Removes duplicates from array
 */
function arrayUnique(array) {
  var a = array.concat();
  for(var i=0; i<a.length; ++i) {
    for(var j=i+1; j<a.length; ++j) {
      if(a[i] === a[j])
        a.splice(j--, 1);
    }
  }

  return a;
};