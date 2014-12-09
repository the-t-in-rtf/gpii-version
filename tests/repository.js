"use strict";
var fluid = require("infusion");

// There is no setup function, so we have to manually initialize our test data before beginning each pass.
var testConfig = require("../configs/test.json");
var repo       = require("../libs/Repo.js");

function runTests() {
    var jqUnit = fluid.require("jqUnit");

    // TODO:  Get rid of this test once we have proper synchronous repo methods...
    jqUnit.module("Repository sanity checks...");

    jqUnit.test("Confirm that a non-existent repo is correctly initialized...", function() {
        jqUnit.assertTrue("The repository directory should exist...", version.repository.dirExists);
        jqUnit.assertTrue("The repository should exist...", version.repository.repoExists);
    });

//    // TODO:  Test initializing a repo that doesn't exist
//
//    // TODO:  Test working with a repoDir that doesn't exist when

    jqUnit.asyncTest("Test adding new content",function() {
        var version    = require("../")(testConfig, function(repository){

        });

        jqUnit.stop();

        // TODO:  Test adding new content

    });

//    // TODO:  Test updating existing content (i.e. making two changes)
//
//    // TODO:  Test viewing the history
//
//    // TODO:  Test viewing a diff between two revisions

    jqUnit.onAllTestsDone.addListener(function() {
        var rmdir = require("rimraf");
        rmdir.sync(testConfig.version.repoDir);
    });
}

runTests();