var fs = require("fs");
var browserify = require("browserify");
browserify(["./scripts/todo.js"])
  .transform("babelify", { compact: false, presets: ["es2015", "react"] })
  .transform("browserify-css", { autoInject: true })
  .bundle()
  .pipe(fs.createWriteStream("public/scripts/bundle.js"));
