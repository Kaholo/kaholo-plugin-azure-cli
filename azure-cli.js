const childProcess = require("child_process");
const { promisify } = require("util");
const { tryParseAzureOutput } = require("./helpers");
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

function createAzCommand(userInput) {
  const additionalArguments = ["-o", "json"];
  return `${userInput} ${additionalArguments.join(" ")}`.trim();
}

function sanitizeUserCommand(command) {
  let sanitized = command;
  if (!command.toLowerCase().startsWith("az ")) {
    sanitized = `az ${command}`;
  }
  return `$(echo "${sanitized}")`;
}

async function execute({ command, credentials }) {
  const azCommand = sanitizeUserCommand(createAzCommand(command));
  const dockerCommand = createDockerCommand(azCommand);
  try {
    const output = await exec(dockerCommand, {
      env: {
        ...credentials,
        COMMAND: azCommand,
      },
    });
    return tryParseAzureOutput(output);
  } catch (error) {
    if (error.stdout) {
      throw tryParseAzureOutput(error);
    }
    throw new Error(error.stderr ?? error.message ?? error);
  }
}

module.exports = {
  execute,
};
