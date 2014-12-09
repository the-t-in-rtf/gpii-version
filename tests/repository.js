"use strict";
var fluid = require("infusion");
var fs    = require("fs");
var rmdir = require("rimraf");

// There is no setup function, so we have to manually initialize our test data before beginning each pass.
var testConfig = require("../configs/test.json");
var repo       = require("../libs/Repo.js");

function uniqueConfig(config) {
    if (!config) { config = testConfig; }
    var newConfig = JSON.parse(JSON.stringify(config));
    newConfig.version.repoDir += "-" + (new Date()).getTime() + "-" + Math.round(Math.random() * 10000);
    newConfig.version.shellOpts.cwd = newConfig.version.repoDir;
    return newConfig;
}

function runTests() {
    var jqUnit = fluid.require("jqUnit");

    jqUnit.module("Repository object sanity checks...");

    jqUnit.asyncTest("Auto initialize a repo...", function() {
        var config = uniqueConfig();

        jqUnit.start();
        jqUnit.assertFalse("The directory should not already exist...", fs.existsSync(config.version.repoDir));
        jqUnit.stop();

        new repo(config, function(repository){
            jqUnit.start();
            jqUnit.assertTrue("The repository directory '" + config.version.repoDir + "' should exist...", repository.dirExists);
            jqUnit.assertTrue("The repository '" + config.version.repoDir + "' should exist...", repository.repoExists);

            // We need to remove our custom directory on our own
            rmdir.sync(config.version.repoDir);
        });
    });

    // Test working with a repoDir that doesn't exist when initRepoIfEmpty is disabled
    jqUnit.asyncTest("Refuse to initialize a repo when initRepoIfEmpty is set to false...", function() {
        var config = uniqueConfig();
        config.version.initRepoIfEmpty = false;

        jqUnit.start();
        jqUnit.assertFalse("The directory should not already exist...", fs.existsSync(config.version.repoDir));
        jqUnit.stop();

        new repo(config, function(repository){
            jqUnit.start();
            jqUnit.assertFalse("The repository directory '" + config.version.repoDir + "' should not exist...", fs.existsSync(config.version.repoDir));
            jqUnit.assertFalse("dirExists should be set to false for '" + config.version.repoDir + "'...", repository.dirExists);
            jqUnit.assertFalse("repoExists should be set to false for '" + config.version.repoDir + "' should not exist...", repository.repoExists);
        });
    });

    jqUnit.asyncTest("Test adding new content...",function() {
        var config = uniqueConfig();

        jqUnit.start();
        jqUnit.assertFalse("The directory should not already exist...", fs.existsSync(config.version.repoDir));
        jqUnit.stop();

        new repo(config, function(repository){
            repository.store("12345", {"foo": "bar"}, null, function() {
                jqUnit.start();

                jqUnit.assertTrue("The newly created file should exist.", fs.existsSync(config.version.repoDir + "/12345" ));

                // We need to remove our custom directory on our own
                rmdir.sync(config.version.repoDir);
            })
        });
    });

    jqUnit.asyncTest("Test adding content with special characters in the id...",function() {
        var config = uniqueConfig();

        jqUnit.start();
        jqUnit.assertFalse("The directory should not already exist...", fs.existsSync(config.version.repoDir));
        jqUnit.stop();

        new repo(config, function(repository){
            var id = "a&'\" -_z;";
            repository.store(id, {"foo": "bar"}, null, function() {
                jqUnit.start();

                jqUnit.assertTrue("The newly created file should exist.", fs.existsSync(config.version.repoDir + "/" + id ));

                // We need to remove our custom directory on our own
                rmdir.sync(config.version.repoDir);
            })
        });
    });


    // TODO:  Test updating existing content, viewing the history, and diffs
    jqUnit.asyncTest("Test adding multiple revisions...",function() {
        var config = uniqueConfig();

        jqUnit.start();
        jqUnit.assertFalse("The directory should not already exist...", fs.existsSync(config.version.repoDir));
        jqUnit.stop();

        new repo(config, function(repository){
            var original = { "foo": "bar" };
            var updated  = { "foo": "baz" };
            repository.store("12345", original, null, function() {
                repository.store("12345", updated, null, function() {
                    jqUnit.start();

                    jqUnit.assertTrue("The newly created file should exist.", fs.existsSync(config.version.repoDir + "/12345" ));

                    jqUnit.stop();
                    repository.listRevs("12345", function(revs){
                        jqUnit.start();
                        jqUnit.assertNotNull("There should be revisions returned...", revs);
                        jqUnit.assertEquals("There should be exactly two revisions...", 2, revs.length);

                        jqUnit.stop();
                        repository.getRev("12345", revs[1], function(content){
                            jqUnit.start();
                            jqUnit.assertNotNull("There should be content returned", content);

                            var data = JSON.parse(content);
                            jqUnit.assertDeepEq("The content for the last revision should be equal to the original...", original, data);

                            //We need to remove our custom directory on our own
                            rmdir.sync(config.version.repoDir);
                        });
                    });
                })
            })
        });
    });
}

runTests();