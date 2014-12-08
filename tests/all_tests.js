// There is no setup function, so we have to manually remove our test data before beginning.
var version = require("../")({"repoDir": "/tmp/version-test"});

// There is no setup function in jqUnit, so we have to wait manually until the repository is initialized before we continue
setTimeout(runTests, 3000);

function runTests() {
    var jqUnit = fluid.require("jqUnit");

    // TODO:  Test adding/retrieving new content

    // TODO:  Test updating content

    // TODO:  Test viewing the history

    // TODO:  Test viewing a diff between two revisions
}