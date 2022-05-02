const { execAzCliCmd, parseUniversalArtifactArgs, azDevOpsLogin } = require("./helpers");
const { listScope } = require("./autocomplete"); 

async function downloadUniArti(action, settings){
	//login to devops 
	try {
		await azDevOpsLogin(action, settings);
	}
	catch (err){
		console.error(JSON.stringify(err));
		return;
	}
	// parse args
	let args = ["artifacts", "universal", "download"];
	parseUniversalArtifactArgs(action, settings, args);

	const fileFilter = (action.params.fileFilter || "").trim();
	if (fileFilter) args.push("--file-filter", fileFilter);
	// call cli
	return execAzCliCmd(args, settings, "Artifacts Universal Download");
}

async function publishUniArti(action, settings){
	//login to devops 
	try {
		await azDevOpsLogin(action, settings);
	}
	catch (err){
		console.error(JSON.stringify(err));
		return;
	}
	// parse args	
	let args = ["artifacts", "universal", "publish"];
	parseUniversalArtifactArgs(action, settings, args);

	const description = (action.params.description || "").trim();
	if (description) args.push("--description", `"${description}"`);
	// call cli
	return execAzCliCmd(args, settings, "Artifacts Universal Publish");
}

module.exports = {
	downloadUniArti,
	publishUniArti,
	listScope
}

