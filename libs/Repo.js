// Add versioning support to any system with unique IDs, backed by a series of GIT repositories.
"use strict";
/* global require */
var fs   = require("fs");
var exec = require("child_process").exec;
var _    = require("underscore");

// I couldn't find a synchronous git wrapper I liked, so I wrote my own.  I am probably a bad person.
var Repo = function (config, callback) {
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
            exec("git init", config.version.shellOpts, function (error) {
                if (!error) {
                    repository.repoExists = true;
                    if (callback) {
                        callback(repository);
                    }
                }
                else { console.error(error); }
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
        console.error("Repo directory '" + config.version.repoDir + "' does not exist and automatic initialization is disabled.");
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
    var parent = this;
    if (idField && data[idField] && data[idField] !== id) {
        exec("git mv " + id + " " + data[idField],  this.config.version.shellOpts, function (error) {
            if (error) {
                console.error("Error renaming file:" + JSON.stringify(error));
                if (callback) { callback(this); }
            }
            else {
                Repo.prototype.commitAndPush.call(parent, callback);
            }
        });
    }
    else {
        fs.writeFileSync(parent.config.version.repoDir + "/" + id, JSON.stringify(data));
        exec("git add " + id,  parent.config.version.shellOpts, function (error) {
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

Repo.prototype.commitAndPush = function (callback) {
    var parent = this;
    exec("git commit -m \"Updated at " + new Date() + "\"",  this.config.version.shellOpts, function (error, stdout) {
        if (error) {
            console.error("Error committing file:" + stdout);
        }
        if (callback) { callback(parent); }

        // TODO:  Add support for pushing to a remote origin if desired.
    });
};

Repo.prototype.idExists = function (id) {
    return fs.existsSync(this.config.version.repoDir + "/" + id);
};

// Makes a call to `git rev-list`, which returns changes, newest first.  Returns `null` if the ID does not exist...
Repo.prototype.listRevs = function (id, callback) {
    var parent = this;
    if (Repo.prototype.idExists.call(parent, id)) {
        exec("git rev-list --all " + id,  this.config.version.shellOpts, function (error, stdout, stderr) {
            var revs = null;
            if (error) {
                console.error("Error retrieving revisions:" + stdout ? stdout : stderr);
            }

            if (stdout.trim() !== "") {
                revs = stdout.trim().split("\n");
            }

            if (callback) { callback(revs); }
        });
    }
    else {
        if (callback) { callback(null); }
    }
};

Repo.prototype.deepDiff = function (object1, object2, path, diffs) {
    // All common fields
    _.intersection(Object.keys(object1), Object.keys(object2)).forEach(function (key) {
        var fullKey = path ? path + "." + key : key;
        var value1 = object1[key];
        var value2 = object2[key];
        if (!_.isEqual(value1, value2)) {
            if (value1 instanceof Object && value2 instanceof Object) {
                Repo.prototype.deepDiff(value1, value2, fullKey, diffs);
            }
            else {
                diffs.changed[fullKey] = {"old": value1, "new": value2};
            }
        }
    });

    // Fields only in object 1
    _.difference(Object.keys(object1), Object.keys(object2)).forEach(function (key) {
        var fullKey = path ? path + "." + key : key;
        var value1 = object1[key];
        diffs.removed[fullKey] = { "old": value1 };
    });

    // Fields only in object 2
    _.difference(Object.keys(object2), Object.keys(object1)).forEach(function (key) {
        var fullKey = path ? path + "." + key : key;
        var value2 = object2[key];
        diffs.added[fullKey] = { "new": value2 };
    });
};

// Return a structured breakdown of differences between two revisions of a file.  Returns null if the id does not exist.
Repo.prototype.diff = function (id, hash1, hash2, callback) {
    var parent = this;
    if (Repo.prototype.idExists.call(parent, id)) {
        var hash1Content = {};
        var hash2Content = {};
        parent.getRev(id, hash1, function (content) {
            hash1Content = content;
            parent.getRev(id, hash2, function (content) {
                hash2Content = content;

                var object1 = JSON.parse(hash1Content);
                var object2 = JSON.parse(hash2Content);

                var diffs = {"added": {}, "removed": {}, "changed": {}};
                Repo.prototype.deepDiff(object1, object2, null, diffs);

                if (callback) { callback(diffs); }
            });
        });
    }
    else {
        if (callback) { callback(null); }
    }
};


// Returns the contents of a stored object at a particular hash revision.  Returns null if the id or hash cannot be found.
Repo.prototype.getRev = function (id, hash, callback) {
    var parent      = this;

    if (Repo.prototype.idExists.call(parent, id)) {
        var patchFile   = parent.config.version.patchDir + "/" + id + "-" + hash + ".patch";
        var patchedFile = parent.config.version.patchDir + "/" + id + "-" + hash + ".patched";
        var diffCmd     = "git diff -p " + hash + " " + id + " > " + patchFile;

        exec(diffCmd,  parent.config.version.shellOpts, function (error, stdout, stderr) {
            if (error) {
                console.error("Error loading diff content:" + stderr + stdout);
                if (callback) { callback(null); }
            }
            else {
                var stats = fs.statSync(patchFile);
                if (stats.size > 0) {
                    var patchCmd = "patch -R -i " + patchFile + " -o " + patchedFile + " " + id;
                    exec(patchCmd,  parent.config.version.shellOpts, function (error, stdout, stderr) {
                        if (error) {
                            console.error("Error loading revision content:" + stderr);
                            if (callback) { callback("{}"); }
                        }
                        else {
                            var content = fs.readFileSync(patchedFile);
                            if (callback) { callback(content.toString()); }
                        }
                    });
                }
                // We are working with the same content we have currently.
                else {
                    var content = fs.readFileSync(parent.config.version.repoDir + "/" + id);
                    if (callback) { callback(content.toString()); }
                }
            }
        });
    }
    else {
        if (callback) { callback(null); }
    }
};

module.exports = Repo;