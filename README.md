# kaholo-plugin-azure-cli
Azure CLI wrapper plugin for Kaholo.

## Settings
1. Azure CLI Path (String) **Optional** - Azure CLI az.bat path, if not provided will use "az" as default.
2. DevOps Organization Server URL (String) **Optional** - Azure DevOps default organization server URL.
3. Default DevOps Project (String) **Optional** - Azure DevOps default project name or ID.
4. Default DevOps Subscription (String) **Optional** - Azure DevOps default subscription ID.
5. DevOps Token (Vault) **Optional** - Azure DevOps token to authenticate with on default for all azure DevOps action.

## Method: Download Universal Artifact
Execute DevOps command az artifacts universal download. Download a universal package.

### Parameters
1. Save Path (String) **Required** - Path in agent to save the package.
2. Organization Server URL (String) **Optional** - Azure DevOps organization server URL.
3. Project (String) **Optional** - Azure DevOps Project to download the package from.
4. Feed (String) **Required** - Azure Artifacts Feed to download the package from.
5. Package Name (String) **Required** - The name of the package to download.
6. Version (String) **Required** - The version of the package to download.
7. Scope (Project/Organization) **Optional** - The scope of the package. Default is Organization.
8. File Filter (String) **Optional** - Wildcard filter of files to download, can be multiple values seperated by commas.
9. Subscription (String) **Optional** - The user subscription ID to make the download request with.
10. DevOps Token (Vault) **Optional** - The DevOps token used to authenticate for this request.

## Method: Publish Universal Artifact
Execute DevOps command az artifacts universal publish. Publish a universal package.


### Parameters
1. Upload Path (String) **Required** - Path in agent to publish the package from.
2. Organization Server URL (String) **Optional** - Azure DevOps organization server URL.
3. Project (String) **Optional** - Azure DevOps Project to publish the package to.
4. Feed (String) **Required** - Azure Artifacts Feed to publish the package to.
5. Package Name (String) **Required** - The name of the package to publish.
6. Version (String) **Required** - The version of the package to publish. must br greater than last version published.
7. Scope (Project/Organization) **Optional** - The scope of the package. Default is Organization.
8. Description (String) **Optional** - Description of the package. Overwrites description of previous versions. 
9. Subscription (String) **Optional** - The user subscription ID to make the publish request with.
10. DevOps Token (Vault) **Optional** - The DevOps token used to authenticate for this request.