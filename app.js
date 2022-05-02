const { bootstrap } = require("kaholo-plugin-library");
const { execute } = require("./azure-cli");
const { readCredentials } = require("./helpers");

function runCommand(params) {
  const credentials = readCredentials(params);
  return execute({
    command: params.command,
    credentials,
  });
}

module.exports = bootstrap({
  runCommand,
});
