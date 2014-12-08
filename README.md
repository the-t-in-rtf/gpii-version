gpii-version
============

A GPII module to add transparent version support for JSON content as it changes.  The module is meant to be backed by a GIT repository, which is uses to prepare the version history and "diffs".

The only requirement in structuring your data for use with this module is that you use a unique identifier for each record.  The unique identifier can be changed, see the documentation for [`versions.store(id, data, [idField]`](https://github.com/the-t-in-rtf/versionstoreid-data-idfield)


# Adding versions support to your code

Add the folllowing to your package.json:

    "version": git://github.com/the-t-in-rtf/gpii-version/master

Then download the package:

    npm install 

From your code, initialize with your own configuration using code like:

	var version = require("version")(config);

For further details on the configuration object, see ["Configuration"](#configuration) below.  You can use the defaults found in config/defaults.json by passing in an empty hash.  For all other usage, see ["API methods"](#api-methods) below.

# API methods

## `version.store(id, data, [idField])`;

Store the associated data as a single commit if there are any changes.  Returns output like:

      {
		"ok": true,
		"id": "myUniqueID"
      }

The additional `idField` parameter is provided to allow for record renaming.  If `idField` is supplied and `id` matches the `idField`, nothing additional is done.  If `id` does not match the value stored in `idField`, then the record is moved and updated as part of a single commit.

## `version.list(id)`;

List the version information associated with `id`.  The version code does not know or care what structure you use for `id`, but `id` must be unique for it to be meaningfully used.  Returns JSON data representing the list of versions as an array, in order by date, as in:

     {
		"ok": true,
		"id": "myUniqueId",
		"versions": [
				"#hash1": {
						  "date":    "2014-12-07T13:16:20.713Z",
					  "sha":     "39357aa325c48accbf5fd61388bad4c7dcc2efbc",
						  "content": { "foo": "bar" }
				},
				"#hash2": {
						  "date":    "2014-12-08T13:16:20.713Z",
					  "sha":     "2fea2d38bc6ef3e718d6ebd699f2a9549c42bd6b",
						  "content": { "foo": "baz" }
				}
		]
     }

The array will be empty if `id` does not exist.  Requests for `id` that have been renamed will return the results for the new `id`, so you should always check the `id` value of the returned data.

## `version.diff(id, hash1, hash2)`;

List any differences between the supplied versions.  Expects a valid `id` and two valid commit hashes (`hash1`, `hash2`). Returns JSON data representing the changes made.

     {
		"ok": true,
		"id": "myUniqueId",
		"diffs": {
			 "field1": {
				   "old": "something old",
				   "new": "something new"
			 },
			 "field2": {
				   "old": null,
				   "new": "A value has been set."
			 },
			 "field3": {
				   "old": "A value has been removed.",
				   "new": null
			 },
		}
     }

Note that fields that are being set for the first time will have a `null` value for `old`.  Fields that are being deleted will have a `null` value for `new`.
If `id` does not exist, `ok` will be set to false. If there are no differences, the `diffs` array will be empty.

# Configuration

The version module follows the GPII conventions regarding configuration options.  There are default settings found in config/defaults.json, which can be overridden by passing in your own configuration object.  Options will be interleaved with the defaults.  To add a new option, simply specify it in context, as in:

    {
	"new": "My own new option that I will use in my code. There are many like it, but this one is mine."
    }

To remove an existing option, specify it in context and set the value to `null`, as in:

   {
	"undesiredDefaultOption": null
   }

The meaningful options supported thus far are:

TODO:  Fill this out


# Running the tests:

To run the acceptance tests for this module, use a command like the following:

	node tests/all_tests.js
