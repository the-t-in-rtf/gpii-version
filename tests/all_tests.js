// TODO:  Make this a real list of tests

var version = require("../")({});

// TODO:  Make sure the repository is initialized before we continue
setTimeout(function() { version.store("1234", {"foo": "bar"}); }, 5000);
