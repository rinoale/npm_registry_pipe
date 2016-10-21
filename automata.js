var Parser = require('./stdParser.js');

var request = require('request');

const spawn = require('child_process').spawn;

// const ls = spawn('ls', ['-al']);
//
// ls.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
// });
//
// ls.stderr.on('data', (data) => {
//   console.log(`stderr: ${data}`);
// });
//
// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });
if (process.argv[2] === undefined) {
  console.error('please pass module name as first argument');
  return 0;
}

var moduleToInstall = process.argv[2];

var moveDir = {
  enter: function (dirName) {
    return new Promise(function (resolve, reject) {
      console.log('entering folder : ' + dirName);

      try {
        const enter = spawn('cd', [dirName]);
      } catch (err) {
        console.log(err);
        reject();
      }


      enter.on('close', (code) => {
        if(code === 0) {
          resolve();
        } else {
          reject(code);
        }
      })
    })
  },
  exit: function () {
    const exit = spawn('cd', ['..']);
  }
}

var removeDir = {
  remove: function () {
    const remove = spawn('rm', ['-rf', 'targetModule']);
  }
}

var npm = {
  install: function (moduleName) {
    const install = spawn('npm', ['install', moduleName]);

    installEvent(install);
  },
  publish: function () {
    return new Promise(function (resolve, reject) {
      const publish = spawn('npm', ['publish', 'targetModule']);

      publish.on('close', (code) => {
        if(code === 0) {
          resolve();
        } else {
          reject(code);
        }
      })
    })
  }
}

function defaultEvent(process) {
  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

function defaultEventCallback(process, callback) {
  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      callback();
    }
  });
}

function installEvent(process) {
  var targetModule = '';
  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    // console.log(`stderr: ${data}`);
    var moduleName = Parser.errParser(data);

    if(moduleName !== undefined) {
      targetModule = moduleName[1];
      console.log('target : ' + moduleName[1]);
    }
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 1) {
      console.log(targetModule);

      var options = {
        url : 'https://registry.npmjs.org/'.concat(targetModule)
      }
      request(options, function (err, res, body) {
        if (err) {
          console.log(err);
          return 0;
        }

        if (res.statusCode === 200) {
          var json_data = JSON.parse(body);
          console.log('cloning : ' + json_data.repository.url);
          var gitUrl = json_data.repository.url;
          
          if (gitUrl.indexOf('+https') > -1) {
            gitUrl = sanitizeGitUrl(gitUrl);
          }
          git.clone(gitUrl);
        } else {
          console.err('failed to get module');
        }
      })
    }
  });
}

function cloneEvent(process) {
  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      console.log('clone done');
      npm.publish().then(function () {
        removeDir.remove();
        npm.install(moduleToInstall);
      }).catch(function (code) {
        console.log('publishing failed with code : ' + code);
      })
    }
  });
}

var git = {
  clone: function (repo) {
    var clone = spawn('git', ['clone', repo, 'targetModule']);

    cloneEvent(clone);
  }
}

var sanitizeGitUrl = function (addr) {
  var sanitized = addr.replace('+https://', '@').replace('github.com/', 'github.com:');
  console.log('Sanitized : ' + sanitized);
  return sanitized;
}

npm.install(moduleToInstall);
