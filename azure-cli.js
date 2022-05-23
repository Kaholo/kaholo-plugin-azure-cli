const kaholoPluginLibrary = require("kaholo-plugin-library");
const childProcess = require("child_process");
const { promisify } = require("util");
const { AZURE_LOGIN_COMMAND, DOCKER_IMAGE } = require("./consts.json");
const { logToActivityLog, validatePaths } = require("./helpers");
const {
  tryParseAzureCliOutput,
  createDockerVolumeConfig,
  createEnvironmentVariableArgumentsString,
  createDockerVolumesString,
} = require("./docker-helpers");

const exec = promisify(childProcess.exec);

async function execute({ command, credentials }) {
  const areCredentialsProvided = Boolean(credentials);

  const volumeConfigsWithPathMatch = await createVolumeConfigsWithPathMatch(command);
  const environmentVariables = volumeConfigsWithPathMatch.reduce((acc, curr) => ({
    ...acc,
    ...curr.volumeConfig.environmentVariables,
  }), {});
  const parsedCommand = volumeConfigsWithPathMatch.reduce((acc, curr) => (
    acc.replace(curr.argument, `$${curr.volumeConfig.mountPoint}`)
  ), command);

  const volumeConfigs = volumeConfigsWithPathMatch.map(({ volumeConfig }) => volumeConfig);

  const azureCliCommand = createAzureCliCommand({
    userInput: parsedCommand,
    areCredentialsProvided,
  });
  const dockerCommand = createDockerCommand({
    command: azureCliCommand,
    environmentVariables: [
      ...resolveEnvironmentVariables({ areCredentialsProvided }),
      ...Object.keys(environmentVariables),
    ],
    volumeConfigs,
  });
  logToActivityLog(`Generated Docker command: ${dockerCommand}`);

  try {
    const output = await exec(dockerCommand, {
      env: {
        ...credentials,
        ...environmentVariables,
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

async function createVolumeConfigsWithPathMatch(command) {
  const pathMatches = kaholoPluginLibrary.helpers.extractPathsFromCommand(command);

  await validatePaths(pathMatches.map(({ path }) => path));

  return pathMatches.map(
    (pathMatch) => ({
      volumeConfig: createDockerVolumeConfig(pathMatch.path),
      ...pathMatch,
    }),
  );
}

function createAzureCliCommand({ userInput, areCredentialsProvided = true }) {
  const additionalArguments = ["-o", "json"];
  let azureCliCommand = `${userInput} ${additionalArguments.join(" ")}`;
  if (!azureCliCommand.toLowerCase().startsWith("az ")) {
    azureCliCommand = `az ${azureCliCommand}`;
  }
  // This is the safest way to escape the user provided command.
  // By putting the command in double quotes, we can be sure that
  // every character within the command is escaped, including the
  // ones that could be used for shell injection (e.g. ';', '|', etc.).
  // The escaped string needs then to be echoed back to the docker command
  // in order to be properly executed - simply passing the command in double quotes
  // would result in docker confusing the quotes as a part of the command.
  azureCliCommand = `$(echo "${JSON.stringify(azureCliCommand)}")`;
  if (areCredentialsProvided) {
    azureCliCommand = `${AZURE_LOGIN_COMMAND} && ${azureCliCommand}`;
  }
  return azureCliCommand;
}

function createDockerCommand({ command, environmentVariables, volumeConfigs }) {
  const environmentVariablesString = createEnvironmentVariableArgumentsString(environmentVariables);
  const volumesString = createDockerVolumesString(volumeConfigs);
  const stringifiedCommand = JSON.stringify(command);

  return `
    docker run --rm \
    ${environmentVariablesString} \
    ${volumesString} \
    ${DOCKER_IMAGE} sh -c ${stringifiedCommand}
  `.trim();
}

function resolveEnvironmentVariables({ areCredentialsProvided = true }) {
  const environmentVariables = [];
  if (areCredentialsProvided) {
    environmentVariables.push(
      "AZURE_SERVICE_PRINCIPAL_ID",
      "AZURE_SERVICE_PRINCIPAL_CREDENTIAL",
      "AZURE_TENANT_ID",
    );
  }
  return environmentVariables;
}

module.exports = {
  execute,
};
