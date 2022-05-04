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

async function execute({ command, credentials }) {
  // This is the safest way to escape the user provided command.
  // By putting the command in double quotes, we can be sure that
  // every character within the command is escaped, including the
  // ones that could be used for shell injection (e.g. ';', '|', etc.).
  // The escaped string needs then to be echoed back to the docker command
  // in order to be properly executed - simply passing the command in double quotes
  // would result in docker confusing the quotes as a part of the command.
  const azureCliCommand = `$(echo "${createAzureCliCommand(command)}")`;
  const dockerCommand = createDockerCommand(azureCliCommand);
  try {
    const output = await exec(dockerCommand, {
      env: {
        ...credentials,
        COMMAND: azureCliCommand,
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
