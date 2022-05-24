const { access } = require("fs/promises");
const fs = require("fs");

function mapParamsToCredentialsAndValidate(params) {
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

function logToActivityLog(message) {
  // TODO: Change console.error to console.info
  // Right now (Kaholo v4.1.2.1) console.info
  // does not print messages to Activity Log
  // Jira ticket: https://kaholo.atlassian.net/browse/KAH-3636
  console.error(message);
}

async function assertPathsExistence(paths) {
  const pathsArray = Array.isArray(paths) ? paths : [paths];

  const pathExistanceCheckPromises = pathsArray.map(pathExists);
  const pathExistanceCheckResults = await Promise.all(pathExistanceCheckPromises);

  const nonexistentPaths = pathsArray.filter((path, index) => !pathExistanceCheckResults[index]);

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

function generateRandomString() {
  return Math.random().toString(36).slice(2);
}

module.exports = {
  mapParamsToCredentialsAndValidate,
  logToActivityLog,
  assertPathsExistence,
  generateRandomString,
};
