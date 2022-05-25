const { generateRandomString } = require("./helpers");

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

function generateRandomEnvironmentVariableName() {
  return `KAHOLO_AZURE_CLI_ENV_${generateRandomString()}`;
}

function generateRandomTemporaryPath() {
  return `/tmp/${generateRandomString()}`;
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

module.exports = {
  tryParseAzureCliOutput,
  createEnvironmentVariableArgumentsString,
  createDockerVolumesString,
  createDockerVolumeConfig,
};
