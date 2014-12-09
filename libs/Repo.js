var fs   = require("fs");
var sys  = require('sys')
var exec = require('child_process').exec;

// I couldn't find a synchronous git wrapper I liked, so I wrote my own.  I am probably a bad person
var Repo = function(config, callback) {
    this.config = config;

    this.dirExists  = fs.existsSync(config.version.repoDir);
    this.repoExists = fs.existsSync(config.version.repoDir + "/.git");

    if ((!this.dirExists || ! this.repoExists) && config.version.initRepoIfEmpty) {
        if (!this.dirExists) {
            fs.mkdirSync(config.version.repoDir);
            this.dirExists = fs.existsSync(config.version.repoDir);
        }

        if (this.dirExists) {
            var repository = this;
            exec("git init", config.version.shellOpts, function (error, stdout, stderr) {
                if (!error) {
                    repository.repoExists = true;
                    if (callback) {
                        callback(repository);
                    }
                }
                else { console.error(error);}
            });
        }
        else {
            console.error("Unable to create directory '" + config.version.repoDir);
            if (callback) {
                callback(this);
            }
        }
    }
    else if ((!this.dirExists || !this.repoExists)) {
        console.error("Repo directory '" + config.version.repoDir + "' does not exist and automatic initialization is disabled.")
        if (callback) {
            callback(this);
        }
    }
};


Repo.prototype = {
    "config":     {},
    "dirExists":  false,
    "repoExists": false
};

Repo.prototype.store = function (id, data, idField, callback) {
    if (idField && data[idField] && data[idField] !== id) {
        exec("git mv " + id + " " + data[idField],  this.config.version.shellOpts, function (error, stdout, stderr) {
            if (error) {
                console.error("Error renaming file:" + JSON.stringify(error));
                if (callback) { callback(this); }
            }
            else {
                this.commitAndPush(callback);
            }
        });
    }
    else {
        var parent = this;
        fs.writeFileSync(parent.config.version.repoDir + "/" + id, JSON.stringify(data));
        exec("git add " + id,  parent.config.version.shellOpts, function (error, stdout, stderr) {
            if (error) {
                console.error("Error adding file:" + JSON.stringify(error));
                if (callback) { callback(parent); }
            }
            else {
                parent.commitAndPush(callback);
            }
        });
    }
};

Repo.prototype.commitAndPush = function(callback) {
    var parent = this;
    exec("git commit -m \"Updated at " + new Date() + "\"",  this.config.version.shellOpts, function (error, stdout, stderr) {
        if (error) {
            console.error("Error committing file:" + stdout);
        }
        if (callback) { callback(parent); }

        // TODO:  Add support for pushing to a remote origin if desired.
    });
};

Repo.prototype.listRevs = function (id, callback) {
    exec("git rev-list --all " + id,  this.config.version.shellOpts, function (error, stdout, stderr) {
        if (error) {
            console.error("Error retrieving revisions:" + stdout);
        }

        revs = stdout.trim().split("\n");

        if (callback) { callback(revs); }
    });
};

Repo.prototype.diff = function (id, hash1, hash2, callback) {
};

Repo.prototype.getRev = function (id, hash, callback) {
    var parent = this;
    var diffCmd = "git diff -p " + hash +  " " + id + " > " + parent.config.version.patchDir + "/" +id + "-" + hash + ".patch"
    debugger;
    exec(diffCmd,  parent.config.version.shellOpts, function (error, stdout, stderr) {
        if (error) {
            console.error("Error loading diff content:" + stderr + stdout);
            if (callback) { callback("{}"); }
        }
        else {
            var patchCmd = "patch -R -i " + parent.config.version.patchDir + "/" +id + "-" + hash + ".patch -o " + parent.config.version.patchDir + "/" + id + ".patched " + id;
            exec(patchCmd,  parent.config.version.shellOpts, function (error, stdout, stderr) {
                if (error) {
                    console.error("Error loading revision content:" + stderr);
                    if (callback) { callback("{}"); }
                }
                else {
                    var content = fs.readFileSync(parent.config.version.patchDir + "/" + id + ".patched");
                    if (callback) { callback(content.toString()); }
                }
            });
        }
    });
};

module.exports = Repo;