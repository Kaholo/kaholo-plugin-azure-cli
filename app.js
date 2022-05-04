const { bootstrap } = require("kaholo-plugin-library");
const { execute } = require("./azure-cli");
const { mapAndValidateCredentials } = require("./helpers");

function runCommand(params) {
  const credentials = mapAndValidateCredentials(params);
  return execute({
    command: params.command,
    credentials,
  });
}

module.exports = bootstrap({
  runCommand,
});
