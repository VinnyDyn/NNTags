import {IInputs, IOutputs} from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
type DataSet = ComponentFramework.PropertyTypes.DataSet;

export class NNTags implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	private _container: HTMLDivElement;
	private _entityLogicalName : string;
	private _entityId : string;
	private _relationShipName : string;
	private _relatedEntityLogicalName : string;
	private _associatedHex : string;

	constructor()
	{
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement)
	{
		if(Xrm.Page.ui.getFormType() == XrmEnum.FormType.Create)
			return;
		
		//Core
		this._entityLogicalName = Xrm.Page.data.entity.getEntityName();
		this._entityId = Xrm.Page.data.entity.getId().replace("{","").replace("}","");
		this._relationShipName = context.parameters.relationship_name.raw;
		this._relatedEntityLogicalName = context.parameters.dataSet.getTargetEntityType();

		//Background Colors
		this._associatedHex = context.parameters.associated_hex.raw;

		//Main div
		this._container = document.createElement("div");
		this._container.setAttribute("class", "Container");
		container.append(this._container);
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void
	{
		if(Xrm.Page.ui.getFormType() == XrmEnum.FormType.Create)
			return;

		//If the view is loaded
		if(!context.parameters.dataSet.loading){
			
			let columns = this.GetColumns(context);
			this.ClearContainer();
			this.CreateButtonTag(context, columns);
			this.RetrieveMultipleManyToManyRelationships();
		}
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs
	{
		return {};
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void
	{
		// Add code to cleanup control if necessary
	}

	/**
	 * Create a button to represents the record
	 * @param context 
	 * @param columns 
	 */
	public CreateButtonTag(context: ComponentFramework.Context<IInputs>, columns: DataSetInterfaces.Column[])
	{
		if(context.parameters.dataSet.sortedRecordIds.length > 0)
		{
			//Record
			for(let recordId of context.parameters.dataSet.sortedRecordIds){

				const self = this;

				//Create a button
				let buttonRecord : HTMLButtonElement;
				buttonRecord = document.createElement("button");
				buttonRecord.setAttribute("associated", false.toString());
				buttonRecord.setAttribute("clicked", false.toString());
				buttonRecord.setAttribute("class", "Unassociated");
				buttonRecord.id = recordId.toString();
				buttonRecord.addEventListener("click", this.ExecuteRequest.bind(this, self, buttonRecord));

				//Columns in view / value
				columns.forEach(function(column, index){
					let attributeValue = document.createElement("p");
					attributeValue.textContent = context.parameters.dataSet.records[recordId].getFormattedValue(column.name);
					buttonRecord.append(attributeValue);
				});

				//Append record to container
				this._container.append(buttonRecord);
			}
		}
	}

	/**
	 * Retrieve all columns in the view
	 * @param context 
	 */
	private GetColumns(context: ComponentFramework.Context<IInputs>) : DataSetInterfaces.Column[]
	{
		//alert(context.parameters.dataSet.columns.length);
		//No columns
		if (!context.parameters.dataSet.columns && context.parameters.dataSet.columns!.length === 0) {
			return [];
		}
		
		let columns = context.parameters.dataSet.columns!.filter(function (columnItem:DataSetInterfaces.Column) { 
			return columnItem.order >= 0 });
		
		// Sort those columns so that they will be rendered in order
		columns.sort(function (a:DataSetInterfaces.Column, b: DataSetInterfaces.Column) {
			return a.order - b.order;
		});

		return columns;
	}

	/**
 * Action executed by record button
 * @param caller 
 * @param button 
 */
	public ExecuteRequest(caller : NNTags, button : HTMLButtonElement) : void
	{
		let clicked = button.getAttribute("clicked");
		//Prevent multiple clicks
		if(false.toString() == clicked)
		{
			//Lock
			button.setAttribute("clicked", true.toString());

			let associated = button.getAttribute("associated");
			if(true.toString() == associated)
				this.DisassociateRequest(caller, button);
			else
				this.AssociateRequest(caller, button);
		}
	}

	/**
	 * Associate the records
	 * @param caller 
	 * @param button 
	 */
	public AssociateRequest(caller : NNTags, button : HTMLButtonElement) : void
	{
		var association = {
			"@odata.id": Xrm.Page.context.getClientUrl() + "/api/data/v9.1/" + this._relatedEntityLogicalName + "s(" + button.id + ")"
		};
		var req = new XMLHttpRequest();
		req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/" + this._entityLogicalName + "s(" + this._entityId + ")/"+ this._relationShipName +"/$ref", true);
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.onreadystatechange = function() {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 204 || this.status === 1223) {
					caller.RecordAssociated(button);
					button.setAttribute("clicked", false.toString());
				} else {
					Xrm.Utility.alertDialog(this.statusText, function(){});
					button.setAttribute("clicked", false.toString());
				}
			}
		};
		req.send(JSON.stringify(association));
	}

	/**
	 * Diassociate the records
	 * @param caller 
	 * @param button 
	 */
	public DisassociateRequest(caller : NNTags, button : HTMLButtonElement) : void
	{
		var req = new XMLHttpRequest();
		req.open("DELETE", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/" + this._entityLogicalName + "s(" + this._entityId + ")/"+this._relationShipName+"("+button.id+")/$ref", true);
		req.setRequestHeader("Accept", "application/json");
		req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		req.setRequestHeader("OData-MaxVersion", "4.0");
		req.setRequestHeader("OData-Version", "4.0");
		req.onreadystatechange = function() {
			if (this.readyState === 4) {
				req.onreadystatechange = null;
				if (this.status === 204 || this.status === 1223) {
					caller.RecordDisassociated(button);
					button.setAttribute("clicked", false.toString());
				} else {
					Xrm.Utility.alertDialog(this.statusText, function(){});
					button.setAttribute("clicked", false.toString());
				}
			}
		};
		req.send();
	}

	/**
	 * Retrieve and flag (change color) all related records
	 */
	private RetrieveMultipleManyToManyRelationships() {
		const self = this;
		Xrm.WebApi.online.retrieveMultipleRecords(this._relationShipName, "?$select=" + this._relatedEntityLogicalName + "id&$filter=" + this._entityLogicalName + "id eq " + this._entityId).then(function success(results) {
			for (var i = 0; i < results.entities.length; i++) {
				let buttonRecord = document.getElementById(results.entities[i][self._relatedEntityLogicalName + "id"].replace("{","").replace("}",""));
				if(buttonRecord)
					self.RecordAssociated(buttonRecord as HTMLButtonElement);
			}
		}, function (error) {
			Xrm.Utility.alertDialog(error.message, function () { });
			return [];
		});
	}

	/**
	 * Change the color for Associated
	 * @param button 
	 */
	public RecordAssociated(button : HTMLButtonElement)
	{
		button.setAttribute("associated", true.toString());
		button.style.backgroundColor = this._associatedHex;
	}

	/**
	 * Change the color for Disassoaciated
	 * @param button 
	 */
	public RecordDisassociated(button : HTMLButtonElement)
	{
		button.setAttribute("associated", false.toString());
		button.style.backgroundColor = null;
	}

	/**
	 * Clear all components in main container
	 */
	private ClearContainer() {
		while (this._container.firstChild) {
			this._container.removeChild(this._container.firstChild);
		}
	}
}