import { HttpClient } from '@angular/common/http';


export class RequestGetCityCoordinates {

    constructor(private http: HttpClient,
    ) { }

    configUrl = 'https://nominatim.openstreetmap.org/search?q=18c+konarskiego,+gliwice&format=json';
    getConfig() {
        return this.http.get(this.configUrl);
    }
}
