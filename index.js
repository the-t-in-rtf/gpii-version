// The main body of the "version" module.

"use strict";

module.exports = function(config) {
    var fluid      = require("infusion");
    var namespace  = "gpii.versions";
    var version    = fluid.registerNamespace(namespace);

    var loader     = require("./configs/lib/config-loader");
    version.config = loader.loadConfig(config);

    // TODO:  Find a reasonable GIT library for node that doesn't use promises or agree to write everything in a promise-friendly way
    version.nodegit = require("nodegit");
    var path        = require('path');


    version.init = function() {
        // Try to open the repository first
        version.nodegit.Repository.open(path.resolve(__dirname, config.repoDir + "/.git"))
        .then(function(repository){
            debugger;
            version.repository = repository;
            return repository.openIndex();
        }, function(err) {
                console.log("Repository '" + config.repoDir + "' doesn't exist, creating one now...");
                version.nodegit.Repository.init(path.resolve(__dirname, config.repoDir), 0).then(function(path, isBare){
                    version.nodeGit.Repository.open(path.resolve(__dirname, config.repoDir)).then(function(repository){
                        debugger;
                        version.repository = repository;
                        return repository.openIndex();
                    });
                });
        })
        .then(function(idx) {
            version.index = idx;
            debugger;
        });
    };

    // TODO: write a module to store new version data (create the record if it doesn't exist)
    version.store = function(id, data, idField) {
        debugger;

        if (!version.repository || !(version.repository instanceof version.nodegit.Repository)) {
            console.log("Cannot store records because the repository was not initialized properly.  Check your logs and configuration files.");
            return null;
        }

        // Check to see if the record exists
        //var index = version.repo.openIndex();

        debugger;
        // If it doesn't, we're creating it
    };

    // TODO:  write a module to list the existing versions for a record
    version.list = function(id) {
        if (!version.repository || !(version.repository instanceof version.nodegit.Repository)) {
            console.log("Cannot list version because the repository was not initialized properly.  Check your logs and configuration files.");
            return null;
        }

    };

    // TODO:  write a module to show the differences between two records
    version.diff = function(id, hash1, hash2) {
        if (!version.repository || !(version.repository instanceof version.nodegit.Repository)) {
            console.log("Cannot display differences because the repository was not initialized properly.  Check your logs and configuration files.");
            return null;
        }

    };

    version.init();

    return version;
}
