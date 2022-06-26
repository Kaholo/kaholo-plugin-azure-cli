const { bootstrap } = require("kaholo-plugin-library");
const { execute } = require("./azure-cli");
const { mapParamsToCredentialsAndValidate } = require("./helpers");

function runCommand(params) {
  const credentials = mapParamsToCredentialsAndValidate(params);
  return execute({
    command: params.command,
    credentials,
  });
}

module.exports = bootstrap({
  runCommand,
});
