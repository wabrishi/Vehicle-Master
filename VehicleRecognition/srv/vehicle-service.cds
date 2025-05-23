using { com.example.vehiclerecognition as db } from '../db/data-model';

service VehicleRecognitionService {
    entity VehicleEntries as projection on db.VehicleEntries;
    action processImage(imageData: String) returns { vehicleNumber: String; ID: UUID; timestamp: Timestamp; message: String };
}
