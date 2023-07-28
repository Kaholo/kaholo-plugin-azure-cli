# Kaholo Azure CLI Plugin
This plugin runs commands using the [Azure Command-Line Interface(CLI)](https://docs.microsoft.com/en-us/cli/azure/). The Azure Command-Line Interface (CLI) is a cross-platform command-line tool to connect to Azure and execute administrative commands on Azure resources.

Kaholo provides focused plugins to work with Azure in a more user-friendly way, for example the [Azure Compute plugin](https://github.com/Kaholo/kaholo-plugin-azure-compute). However the Azure CLI plugin offers an advantage in that it can run myriad commands operating on a broad spectrum of Azure resources. Also if you are already familiar with the Azure CLI or migrating from another system that uses the Azure CLI, this plugin may ease your transition to Kaholo considerably. Finally, if any of the focused plugins are missing a particular feature you need, this plugin can fill that gap in your pipeline until the additional feature becomes available.

Azure CLI commands are easily recognizable because they all begin with `az`. Some examples include:

    `az vm list`

    `az group create --name myResourceGroup --location eastus`

    `az aks create --resource-group myResourceGroup --name myAKSCluster --node-count 1 --enable-addons monitoring --generate-ssh-keys`

The output of the command, which would normally appear in the command window, is made available in Final Result section of the Execution Results page in Kaholo. This is also downloadable and accessible in code as a JSON document.

If you encounter any difficulties using this plugin, please do [let us know](https://kaholo.io/contact/).

## Use of Docker
This plugin relies on the [Microsoft-provided docker container](https://docs.microsoft.com/en-us/cli/azure/run-azure-cli-docker) to run the Azure CLI. This has many upsides but a few downsides as well of which the user should be aware.

If running your own Kaholo agents in a custom environment, you will have to ensure docker is installed and running on the agent and has sufficient privilege to retrieve the image and start a container. If the agent is already running in a container (kubernetes or docker) then this means a docker container running within another container.

The first time the plugin is used on each agent, docker may spend a minute or two downloading the image. After that the delay of starting up another docker image each time is quite small, a second or two.

## Access and Authentication
Azure CLI has many ways to authenticate. The most common is using the CLI command `az login`, which redirects to an interactive web page to authenticate using a user identity and put security tokens on your local machine. This cannot work in automation, so instead a "Service Principal" is needed to use the plugin.

An Azure service principal is an identity created for use with applications, hosted services, and automated tools to access Azure resources. This access is restricted by the roles assigned to the service principal, giving you control over which resources can be accessed and at which level. For security reasons, it's always recommended to use service principals with automated tools such as the Azure CLI plugin.

### Create an Azure service principal ###
There are [many ways](https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli) to create an Azure service principal. This section describes only one relatively simple method as a quick-start guide.

To create an Azure service principal (using the Azure CLI), you will need first to [install the CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) on your local machine and use the cli to log into Azure with command `az login`. This creates a folder named `.azure` in your home folder, e.g. `/home/username/.azure`, or on Windows `C:\user\username\.azure`. In that folder you will find file `azureProfile.json` which contains your subscription ID, which will be needed in the next step.

Then to create the service principal, run a command like below, substiting the example given for your actual subscription ID, and `azure-contrib` with the name you wish to give your service principle:

    `az ad sp create-for-rbac --name azure-contrib --role contributor --scopes /subscriptions/647d8cc0-6b56-1234-9b21-975717b402e8`

This will return the service principle credentials. These should be KEPT SECRET, particularly the password, because anybody with these can use your Azure account for their own purposes. (There is an alternate way that generates a certificate instead of a password, which will also work with the Kaholo plugin.)

    {
      "appId": "49efa6be-0728-4294-a58b-82c2e237578d",
      "displayName": "azure-contrib",
      "password": "JgD2XGXJ9E-1DanZyUDW1O~wa1AnCX_Bxj",
      "tenant": "c85323c6-b2c5-1234-877a-27a91a29e06f"
    }

These credentials can also be deleted using the Azure CLI, for that the appID is required. Once deleted they can no longer be used by the plugin or for any other purpose.

    `az ad sp delete --id 49efa6be-0728-4294-a58b-82c2e237578d`

The Kaholo Azure CLI plugin requires three of these parameters:
* Service Principal ID, e.g. `49efa6be-0728-4294-a58b-82c2e237578d`, aka "appId"
* Service Principal Credential, e.g. `JgD2XGXJ9E-1DanZyUDW1O~wa1AnCX_Bxj`, either a password or certificate can be used here.
* Tenant ID, e.g. `c85323c6-b2c5-1234-877a-27a91a29e06f`

Because the first and especially the second parameter are secrets, they are stored in the Kaholo Vault. This prevents them appearing in the user interface, execution results, or server logs.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## Plugin Settings
Plugin Settings are accessible by clicking Plugins | Settings and then clicking on the name of this plugin, which is a blue hyperlink. There are no settings for this plugin but in the 2nd tab you'll find Kaholo Accounts. This is used to provide credentials for your Azure CLI commands and to optionally apply a set of them by default so they needn't be configured individually on an action-by-action basis.

The Kaholo Account for the Azure CLI Plugin includes the three items discussed above in the [Access and Authentication](#Access-and-Authentication) section.

* Default Service Principal ID
* Default Service Principal Credential
* Default Tenant ID

The account may also be configured at the action level, by first selecting a method and then choosing "Add New Plugin Account" from the drop-down menu for parameter "Account".

## Method Run Command ##
The only method in the plugin is method `Run Command`. The required parameters include the same three discussed above in the [Access and Authentication](#Access-and-Authentication) section, and one more for the command itself.

### Parameter: Working Directory
For Azure CLI commands that consume or produce files on disk, a working directory may be provided. This causes docker to mount the provided directory on the agent so its files and subdirectories are accessible from within the container running the Azure CLI command. If left unconfigured the default working directory will be used instead, e.g. `/twiddlebug/workspace`. Working directory may be either an absolute path on the Kaholo agent or a path relative to the default working directory.

### Parameter: Command
Only Azure CLI commands can be run using this plugin, i.e. commands that begin with `az`. If you want to run other commands please see the [Command Line plugin](https://github.com/Kaholo/kaholo-plugin-cmd) instead.