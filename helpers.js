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

function createEnvironmentVariableArgumentsString(environmentVariables) {
  return environmentVariables.map(
    (environmentVariable) => `-e ${environmentVariable}`,
  ).join(" ");
}

module.exports = {
  mapAndValidateCredentials,
  tryParseAzureCliOutput,
  createEnvironmentVariableArgumentsString,
};
