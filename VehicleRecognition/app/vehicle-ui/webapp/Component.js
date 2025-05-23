sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device"
    // "com/example/vehicleui/model/models" // Assuming you might add a models.js later, for now, this can be simple
], function (UIComponent, Device) {
    "use_strict";

    return UIComponent.extend("com.example.vehicleui.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model (optional, but good practice)
            // var oDeviceModel = new JSONModel(Device);
            // oDeviceModel.setDefaultBindingMode("OneWay");
            // this.setModel(oDeviceModel, "device");
        }
    });
});
