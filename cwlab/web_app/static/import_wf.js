class ImportCwlZip extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            importName: "",
            actionStatus: "none",
            importMessages: [],
            extractedTmpDir: "",
            cwlPath: ""
        }

        this.changeInputField = this.changeInputField.bind(this);
        this.onUploadCompletion = this.onUploadCompletion.bind(this);
        this.onCWLSelection = this.onCWLSelection.bind(this);
        this.importCWLPath = this.importCWLPath.bind(this);
        this.browseContent = this.browseContent.bind(this);
        this.ajaxRequest = ajaxRequest.bind(this);
    }

    changeInputField(event){
        this.setState({
            [event.currentTarget.name]: event.currentTarget.value
        })
    }

    onUploadCompletion(isSuccess, data){
        if (isSuccess){
            this.setState({
                extractedTmpDir: data["temp_dir"],
                cwlPath: ""
            })
        }
        else {
            this.setState({
                extractedTmpDir: "",
                cwlPath: ""
            })
        }
    }

    onCWLSelection(changes, selectedItem){
        if (changes){
            this.setState({
                cwlPath: selectedItem,
                importName: selectedItem.split('\\').pop().split('/').pop().replace(".cwl", "").replace(".CWL",""),
                actionStatus: "none"
            })
        }
        else {
            this.setState({
                actionStatus: "none"
            })
        }
    }

    browseContent(){
        this.setState({actionStatus: "browse"})
    }

    importCWLPath(){
        this.ajaxRequest({
            statusVar: "actionStatus",
            statusValueDuringRequest: "import",
            messageVar: "importMessages",
            sendData: {
                wf_path: this.state.cwlPath,
                import_name: this.state.importName
            },
            route: routeImportCwlByPathOrUrl
        })
    }

    render(){
        const cwlBasename = this.state.cwlPath.split('\\').pop().split('/').pop()
        return(
            <div className="w3-panel">
                <p>
                    Import CWL document(s) via a zip file
                </p>
                <span className="w3-text-green">1. Choose a zip file containing CWL documents:</span>&nbsp;
                <FileUploadComponent
                    requestRoute={routeUploadCwlZip}
                    buttonLabel="extract content"
                    onUploadCompletion={this.onUploadCompletion}
                />
                {this.state.extractedTmpDir && (
                    <span>
                        
                        <span className="w3-text-green">
                            2. Browse the zip content and select a CWL document to import:
                        </span>
                        <br/>
                        <ActionButton
                            name="browse"
                            value="browse"
                            onAction={this.browseContent}
                            label="browse and select"
                            loading={this.state.actionStatus == "browse"}
                            disabled={this.state.actionStatus != "none"}
                        />&nbsp;
                        <IneditableValueField>
                            {this.state.cwlPath ? (
                                    cwlBasename
                                ) : (
                                    "no CWL document selected"
                                )
                            }
                        </IneditableValueField>
                        {this.state.actionStatus == "browse" && (
                            <BrowseDir
                                path={this.state.cwlPath}
                                fileExts={["cwl", "CWL"]}
                                allowInput={true}
                                fixedBaseDir={this.state.extractedTmpDir}
                                fixedBaseDirName={"ZIP_CONTENT"}
                                defaultBaseDir={this.state.extractedTmpDir}
                                selectDir={false}
                                includeTmpDir={true}
                                showCancelButton={true}
                                terminateBrowseDialog={this.onCWLSelection}
                            />
                        )}
                        {this.state.cwlPath && (
                            <span>
                                <br/>
                                <div className="w3-text-green" style={ {paddingTop: "10px"} }>3. Choose a name and import:</div>
                                <input type="text"
                                    className="w3-input w3-border"
                                    name="importName"
                                    style={ {width: "50%", display: "inline-block"} }
                                    value={this.state.importName}
                                    onChange={this.changeInputField}
                                />
                                <ActionButton
                                    name="import"
                                    value="import"
                                    onAction={this.importCWLPath}
                                    label="import using selected name"
                                    loading={this.state.actionStatus == "import"}
                                    disabled={this.state.actionStatus != "none"}
                                />
                                <DisplayServerMessages messages={this.state.importMessages} />
                            </span>
                        )}
                    </span>

                )}
            </div>
        )
    }

}

class ImportWfFile extends React.Component{
    constructor(props){
        super(props);
        // props.wfType cwl or wdl

        this.state = {
            importName: "",
            actionStatus: "none",
            serverMessages: [],
            wfFile: null,
            wfImportsZip: null,
            provideWfImportsZip: false
        }

        this.changeInputField = this.changeInputField.bind(this);
        this.upload = this.upload.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
    }

    changeInputField(event){
        this.setState({
            [event.currentTarget.name]: event.currentTarget.value
        })
    }

    handleFileChange(event){
        this.setState({
            [event.currentTarget.name]: event.currentTarget.files[0],
            serverMessages: []
        })
    }

    upload(){ // ajax request to server
        if (this.state.wfFile == ""){
            this.state.serverMessages = [{type:"error", text:"No file selected."}]
            this.setState({actionStatus: "none", error: true})
        }
        else{
            this.setState({actionStatus:"uploading"})
            let formData = new FormData()
            formData.append("wf_file", this.state.wfFile)
            formData.append("meta", JSON.stringify({
                "import_name": this.state.importName,
                "wf_type": this.props.wfType
            }))
            fetch(routeUploadWf, {
                method: "POST",
                body: formData,
                cache: "no-cache"
            }).then(res => res.json())
            .then(
                (result) => {
                    var messages = result.messages;
                    var data = result.data;
                    let errorOccured = false;
                    for( let i=0;  i<messages.length; i++){
                        if(messages[i].type == "error"){
                            errorOccured = true;
                            break;
                        }
                    }
                    if (errorOccured){
                        this.setState({actionStatus: "none", error: true, serverMessages: messages})
                    } 
                    else {
                        this.setState({actionStatus: "none", error: false, serverMessages: messages});
                    }
                },
                (error) => {
                    // server could not be reached
                    var messages = [{
                        time: get_time_str(),
                        type: "error", 
                        text: serverNotReachableError
                    }];
                    this.setState({actionStatus: "none", error: true, serverMessages: messages});
                }
            )
        }
    }

    render(){
        return(
            <div className="w3-panel">
                <p>
                    {this.props.wfType == "CWL" ? (
                        "Import a CWL-wrapped tool or a packed CWL workflow."
                        ):(
                        "Import a WDL workflow."   
                    )}
                </p>
                <span className="w3-text-green">
                    1. Choose a {this.props.wfType} file:
                </span>&nbsp;                
                <Message type="hint">
                    <b>Please Note: CWL workflows are only supported in packed format (workflow with all contained tools).</b>&nbsp;
                    You may provide a ZIP file containing non-packed CWL workflows with all it's dependencies (see above "from ZIP file") or see&nbsp;
                    <a href="https://github.com/common-workflow-language/cwltool#combining-parts-of-a-workflow-into-a-single-document">
                        the documentation of cwltool
                    </a> for details on how to pack a workflow.
                </Message>    
                <input 
                    className="w3-button w3-border w3-border-grey"
                    type="file" 
                    name="wfFile" 
                    onChange={this.handleFileChange}
                    disabled={this.state.actionStatus != "none"}
                />
                <br/>
                <span className="w3-text-green">2. Choose a name:</span>&nbsp;
                <input type="text"
                    className="w3-input w3-border"
                    name="importName"
                    style={ {width: "50%"} }
                    value={this.state.importName}
                    onChange={this.changeInputField}
                />
                <ActionButton 
                    name="import"
                    value="import"
                    label="import"
                    loading={this.state.actionStatus == "uploading"} 
                    onAction={this.upload}
                    disabled={this.state.actionStatus != "none"}
                />
                <DisplayServerMessages messages={this.state.serverMessages} />
            </div>
        )
    }
}

class ImportCwlUrl extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            importName: "",
            cwlUrl: "",
            actionStatus: "none",
            importMessages: []
        }

        this.changeInputField = this.changeInputField.bind(this);
        this.importCWLUrl = this.importCWLUrl.bind(this);
        this.ajaxRequest = ajaxRequest.bind(this);
    }

    changeInputField(event){
        this.setState({
            [event.currentTarget.name]: event.currentTarget.value
        })
    }

    importCWLUrl(){
        this.ajaxRequest({
            statusVar: "actionStatus",
            statusValueDuringRequest: "import",
            messageVar: "importMessages",
            sendData: {
                wf_path: this.state.cwlUrl,
                is_url: true,
                import_name: this.state.importName
            },
            route: routeImportCwlByPathOrUrl
        })
    }

    render(){
        return(
            <div className="w3-panel">
                <p>
                    Import a CWL-wrapped tool or CWL workflow (packed or not) from a public URL.
                </p>
                <span className="w3-text-green">1. Provide a URL to a CWL document:</span>&nbsp;
                <Message type="hint">
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <i className="fab fa-github" style={ {fontSize:"48px"} }/>
                                </td>
                                <td>
                                    You can directly use a URL from github. However, please make sure to provide the URL to the raw file, e.g.:<br/>
                                    <a href="https://raw.githubusercontent.com/CompEpigen/ATACseq_workflows/1.2.0/CWL/workflows/ATACseq.cwl">
                                        https://raw.githubusercontent.com/CompEpigen/ATACseq_workflows/1.2.0/CWL/workflows/ATACseq.cwl
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </Message>
                <input type="text"
                    className="w3-input w3-border"
                    name="cwlUrl"
                    style={ {width: "50%"} }
                    value={this.state.cwlUrl}
                    onChange={this.changeInputField}
                />
                <br/>
                <span className="w3-text-green">2. Choose a name:</span>&nbsp;
                <input type="text"
                    className="w3-input w3-border"
                    name="importName"
                    style={ {width: "50%"} }
                    value={this.state.importName}
                    onChange={this.changeInputField}
                />
                <br/>
                <ActionButton
                    name="import"
                    value="import"
                    onAction={this.importCWLUrl}
                    label="import using selected name"
                    loading={this.state.actionStatus == "import"}
                    disabled={this.state.actionStatus != "none"}
                />
                <DisplayServerMessages messages={this.state.importMessages} />
            </div>
        )
    }
}



class ImportCWLRoot extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            importMethod: "cwlUrl"
        }

        this.importMethods = {
            cwlUrl: {
                descr: "URL to public CWL document (e.g. from github)",
                component: <ImportCwlUrl />
            },
            cwlFile: {
                descr: "from CWL file",
                component: <ImportWfFile wfType="CWL"/>
            },
            cwlZip: {
                descr: "from ZIP file (e.g. a CWL workflow with its dependencies)",
                component: <ImportCwlZip />
            }
        }

        this.changeInputField = this.changeInputField.bind(this);
    }

    changeInputField(event){
        this.setState({
            [event.currentTarget.name]: event.currentTarget.value
        })
    }

    render() {
        return(
            <div className="w3-panel">
                <h3>Import a Tool or Workflow</h3>
                <select className="w3-button w3-white w3-border w3-padding-small" 
                    name="importMethod"
                    onChange={this.changeInputField}
                    value={this.state.importMethod}
                >
                    {
                        Object.keys(this.importMethods).map((importMethod) =>
                            <option key={importMethod} value={importMethod}>
                                {this.importMethods[importMethod].descr}
                            </option>
                        )
                    }
                </select> 
                <hr/>
                {this.importMethods[this.state.importMethod].component}
            </div>
        );
    }
}