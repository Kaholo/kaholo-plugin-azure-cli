const child_process = require("child_process");

async function execAzCliCmd(args, settings, description){
    const cmd = `${settings.azPath ? `"${settings.azPath}"` : "az"} ${args.join(" ")}`;
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                return reject(`${description} error: ${error}`);
            }
            if (stderr) {
                console.log(`${description} stderr: ${stderr}`);
            }
            return resolve(stdout);
        });
    });
}

function parseUniversalArtifactArgs(action, settings, args){
    // parse required params
    const name = (action.params.package || "").trim();
    const feed = (action.params.feed || "").trim();
    const version = (action.params.version || "").trim();
    const path = (action.params.path || "").trim();

    if (!name || !feed || !version || !path){
        throw "One of required parameters was not provided!";
    }
    args.push("--feed", feed, "-n", name, "--path", path, "-v", version);
    // parse additional params
    const orgUrl = (action.params.orgUrl || settings.devOpsOrgUrl || "").trim();
    const project = (action.params.project || settings.devOpsProject || "").trim();
    const scope = parseAutoComplete(action.params.scope || "organization");
    const subscription = (action.params.subscription || settings.subscription || "").trim();

    if (orgUrl) args.push("--organization", orgUrl);
    if (project) args.push("-p", project);
    if (scope) args.push("--scope", scope);
    if (subscription) args.push("--subscription", subscription);
}

async function azDevOpsLogin(action, settings){
    const token = (action.params.devOpsToken || settings.devOpsToken || "").trim();
    if (!token) return;

    const azPath = settings.azPath ? `"${settings.azPath}"` : "az";
    const orgUrl = (action.params.orgUrl || settings.devOpsOrgUrl || "").trim();
    const subscription = (action.params.subscription || settings.subscription || "").trim();
    

    let args = ["devops", "login"];
    if (orgUrl) args.push("--org", orgUrl);
    if (subscription) args.push("--subscription", subscription);

    return new Promise((resolve, reject) => {
        const login = child_process.spawn(azPath, args, {shell: true});
        
        login.stdin.setEncoding('utf-8');
        login.stdin.write(token + "\n");
        login.stdin.end();
        
        login.on('error', (err) => {
            return reject({status: "failed", error: err});
        });
        login.stdout.on('data', (data) => {
            console.log(data.toString());
        })
        login.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        })
        login.on('exit', (code) => {
            if (code === 0){
                return resolve({status: "success"});
            }
            return reject({status: "failed", error: new Error(`Bad return code: ${code}`)});
        });
    });
}

function parseAutoComplete(arg){
    try { 
        if (arg.id) return arg.id
    } catch (err) {}
    return arg;
}

module.exports = {
    execAzCliCmd,
    parseUniversalArtifactArgs,
    azDevOpsLogin
};
