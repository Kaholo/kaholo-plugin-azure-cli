const childProcess = require("child_process");
const { promisify } = require("util");
const { tryParseAzureCliOutput } = require("./helpers");
const { AZURE_LOGIN_COMMAND, DOCKER_IMAGE } = require("./consts.json");

const exec = promisify(childProcess.exec);

function createDockerCommand(userCommand) {
  return `
    docker run \
    -e AZURE_SERVICE_PRINCIPAL_ID \
    -e AZURE_SERVICE_PRINCIPAL_CREDENTIAL \
    -e AZURE_TENANT_ID \
    -e COMMAND \
    --rm ${DOCKER_IMAGE} \
    ${AZURE_LOGIN_COMMAND} > /dev/null && ${userCommand}
  `.trim();
}

function createAzureCliCommand(userInput) {
  const additionalArguments = ["-o", "json"];
  return `${userInput.startsWith("az ") ? "" : "az"} ${userInput} ${additionalArguments.join(" ")}`.trim();
}

function sanitizeUserCommand(command) {
  return `$(echo "${command}")`;
}

async function execute({ command, credentials }) {
  const azCommand = sanitizeUserCommand(createAzureCliCommand(command));
  const dockerCommand = createDockerCommand(azCommand);
  try {
    const output = await exec(dockerCommand, {
      env: {
        ...credentials,
        COMMAND: azCommand,
      },
    });
    return tryParseAzureCliOutput(output);
  } catch (error) {
    if (error.stdout) {
      throw tryParseAzureCliOutput(error);
    }
    throw new Error(error.stderr ?? error.message ?? error);
  }
}

module.exports = {
  execute,
};
