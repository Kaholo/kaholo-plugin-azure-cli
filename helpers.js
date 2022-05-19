const kaholoPluginLibrary = require("kaholo-plugin-library");
const { access } = require("fs/promises");
const fs = require("fs");

function mapAndValidateCredentials(params) {
  const credentials = {
    AZURE_SERVICE_PRINCIPAL_ID: params.servicePrincipalId,
    AZURE_SERVICE_PRINCIPAL_CREDENTIAL: params.servicePrincipalCredential,
    AZURE_TENANT_ID: params.tenantId,
  };
  let missingParameter = "";
  if (!credentials.AZURE_SERVICE_PRINCIPAL_ID) {
    missingParameter = "Service Principal ID";
  }
  if (!credentials.AZURE_SERVICE_PRINCIPAL_CREDENTIAL) {
    missingParameter = "Service Prinicipal Credential";
  }
  if (!credentials.AZURE_TENANT_ID) {
    missingParameter = "Tenant ID";
  }
  if (missingParameter) {
    throw new Error(`Missing parameter "${missingParameter}". Please specify it in the action's parameters or plugin's settings.`);
  }
  return credentials;
}

function tryParseAzureCliOutput(output) {
  try {
    return { ...output, stdout: JSON.parse(output.stdout.trim()) };
  } catch {
    return output;
  }
}

function createEnvironmentVariableArgumentsString(environmentVariables = []) {
  return environmentVariables.map(
    (environmentVariable) => `-e ${environmentVariable}`,
  ).join(" ");
}

function createDockerVolumesString(volumeConfigs = []) {
  return volumeConfigs.map(
    ({ path, mountPoint }) => `-v $${path}:$${mountPoint}`,
  ).join(" ");
}

function logToActivityLog(message) {
  // TODO: Change console.error to console.info
  // Right now (Kaholo v4.1.2.1) console.info
  // does not print messages to Activity Log
  // Jira ticket: https://kaholo.atlassian.net/browse/KAH-3636
  console.error(message);
}

async function parseUserCommand(command) {
  const pathMatches = kaholoPluginLibrary.helpers.extractPathsFromCommand(command);

  await validatePaths(pathMatches.map(({ path }) => path));

  const matchesWithVolumeConfigs = pathMatches.map(
    (pathMatch) => ({
      volumeConfig: createDockerVolumeConfig(pathMatch.path),
      ...pathMatch,
    }),
  );
  const parsedCommand = replacePathsWithVolumeConfigEnvironmentVariable(
    command,
    matchesWithVolumeConfigs,
  );

  const volumeConfigs = matchesWithVolumeConfigs.map(({ volumeConfig }) => volumeConfig);
  const environmentVariables = matchesWithVolumeConfigs.reduce(
    (accumulatedVariables, currentMatch) => ({
      ...accumulatedVariables,
      ...currentMatch.volumeConfig.environmentVariables,
    }),
    {},
  );

  return {
    volumeConfigs,
    environmentVariables,
    parsedCommand,
  };
}

async function validatePaths(paths) {
  const pathsArray = Array.isArray(paths) ? paths : [paths];

  const pathPromises = pathsArray.map(pathExists);
  const pathResults = await Promise.all(pathPromises);

  const nonexistentPaths = pathsArray.filter((path, index) => !pathResults[index]);

  if (nonexistentPaths.length === 1) {
    throw new Error(`Path ${nonexistentPaths[0]} does not exist!`);
  } else if (nonexistentPaths.length > 1) {
    throw new Error(`Paths ${nonexistentPaths.join(", ")} do not exist!`);
  }
}

async function pathExists(path) {
  try {
    await access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function createDockerVolumeConfig(path) {
  const pathEnvironmentVariable = generateRandomEnvironmentVariableName();
  const mountPointEnvironmentVariable = generateRandomEnvironmentVariableName();

  return {
    path: pathEnvironmentVariable,
    mountPoint: mountPointEnvironmentVariable,
    environmentVariables: {
      [pathEnvironmentVariable]: path,
      [mountPointEnvironmentVariable]: generateRandomTemporaryPath(),
    },
  };
}

function replacePathsWithVolumeConfigEnvironmentVariable(command, matches) {
  let finalCommand = command;

  matches.forEach((match) => {
    finalCommand = finalCommand.replace(match.argument, `$${match.volumeConfig.mountPoint}`);
  });

  return finalCommand;
}

function generateRandomEnvironmentVariableName() {
  return `KAHOLO_AZURE_CLI_ENV_${generateRandomString()}`;
}

function generateRandomTemporaryPath() {
  return `/tmp/${generateRandomString()}`;
}

function generateRandomString() {
  return Math.random().toString(36).slice(2);
}

module.exports = {
  mapAndValidateCredentials,
  tryParseAzureCliOutput,
  createEnvironmentVariableArgumentsString,
  logToActivityLog,
  parseUserCommand,
  createDockerVolumesString,
};
