const { bootstrap } = require("kaholo-plugin-library");
const { execute } = require("./azure-cli");
const { mapParamsAndValidateCredentials } = require("./helpers");

function getCliVersion() {
  return execute({
    command: "az version",
  });
}

function runCommand(params) {
  const credentials = mapParamsAndValidateCredentials(params);
  return execute({
    command: params.command,
    credentials,
  });
}

module.exports = bootstrap({
  runCommand,
  getCliVersion,
});
