sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("com.example.vehicleui.controller.App", {
        onInit: function () {
            var oUiModel = new JSONModel({
                extractedNumber: "",
                ocrMessage: "",
                file: null
            });
            this.getView().setModel(oUiModel, "ui");
        },

        onFileChange: function(oEvent) {
            var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            if (oFile) {
                this.getView().getModel("ui").setProperty("/file", oFile);
            }
        },

        onUploadPress: function () {
            var oFile = this.getView().getModel("ui").getProperty("/file");
            if (!oFile) {
                MessageToast.show("Please select an image file first.");
                return;
            }

            var oReader = new FileReader();
            oReader.onload = function (e) {
                var sBase64ImageData = e.target.result;
                this._callProcessImageAction(sBase64ImageData);
            }.bind(this);
            oReader.onerror = function (e) {
                MessageToast.show("Error reading file.");
                console.error("File reading error", e);
            };
            oReader.readAsDataURL(oFile);
        },

        _callProcessImageAction: function(sBase64ImageData) {
            var oModel = this.getView().getModel();
            var oUiModel = this.getView().getModel("ui");
            var sActionPath = "/processImage"; 

            oUiModel.setProperty("/ocrMessage", "Processing image...");
            oUiModel.setProperty("/extractedNumber", "");

            var oAction = oModel.bindContext(sActionPath + "(...)");
            oAction.setParameter("imageData", sBase64ImageData);

            oAction.execute()
                .then(function() { // oResult is not directly used here, we get properties from context
                    var oActionContext = oAction.getBoundContext();
                    var sVehicleNumber = oActionContext.getProperty("vehicleNumber");
                    var sMessage = oActionContext.getProperty("message");
                    var sId = oActionContext.getProperty("ID"); // Get ID for potential use

                    oUiModel.setProperty("/extractedNumber", sVehicleNumber);
                    oUiModel.setProperty("/ocrMessage", sMessage);
                    
                    if (sId && sVehicleNumber) { // Check if an ID was returned, implying successful creation
                         MessageToast.show("Processing complete: " + sMessage);
                        // Refresh the binding of the table to show the new entry
                        var oTable = this.byId("vehicleEntriesTable");
                        if (oTable) {
                            oTable.getBinding("items").refresh();
                            console.log("VehicleEntries table refreshed.");
                        }
                    } else {
                        // Handle cases where OCR might have run but no new entry was created (e.g. no text found)
                        MessageToast.show(sMessage || "OCR process finished.");
                    }
                }.bind(this))
                .catch(function(oError) {
                    console.error("Error calling processImage action", oError);
                    var sErrorMessage = "Error processing image.";
                    // Attempt to get a more specific error message from the OData error response
                    if (oError && oError.error && oError.error.message) {
                       sErrorMessage = oError.error.message;
                    } else if (oError && oError.message) {
                       sErrorMessage = oError.message;
                    }
                    oUiModel.setProperty("/ocrMessage", sErrorMessage);
                    MessageToast.show(sErrorMessage);
                }.bind(this));
        }
    });
});
