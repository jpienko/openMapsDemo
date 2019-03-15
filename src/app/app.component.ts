import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import OlMap from 'ol/Map';
import OlVectorSource from 'ol/source/Vector';
import OlFeature from 'ol/Feature';
import OlVectorLayer from 'ol/layer/Vector';
import OlTileLayer from 'ol/layer/tile';
import OlOverlay from 'ol/overlay';
import OlXYZ from 'ol/source/xyz';
import OlView from 'ol/view';

declare var ol: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  latitude = 50.5204;
  longitude = 20.8567;
  address;
  list: any;
  map: OlMap;
  source: OlXYZ;
  layer: OlTileLayer;
  view: OlView;
  olOverlay: OlOverlay;
  olFeature: OlFeature;
  vectorLayer: OlVectorLayer;


  constructor(private http: HttpClient, ) { }

  ngOnInit() {
    this.test();
  }

  test() {
    const mousePositionControl = new ol.control.MousePosition({
      coordinateFormat: ol.coordinate.createStringXY(4),
      projection: 'EPSG:4326',
      className: 'custom-mouse-position',
      target: document.getElementById('mouse-position'),
      undefinedHTML: '&nbsp;'
    });

    this.source = new ol.source.XYZ({
      // tslint:disable-next-line:max-line-length
      url: 'https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
    });

    this.view = new ol.View({
      center: ol.proj.fromLonLat([this.longitude, this.latitude]),
      zoom: 7,
    });

    this.map = new ol.Map({
      target: 'map',
      controls: ol.control.defaults({
        attributionOptions: {
          collapsible: false
        }
      }).extend([mousePositionControl]),
      layers: [new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
      new ol.layer.Vector({
        source: new ol.source.Vector()
      }),
      ],
      view: this.view
    });
    this.setCenter();

    this.addMarker(this.longitude, this.latitude, 'random');
    const self = this;

    this.map.on('dblclick', function (args) {

      const lonlat = ol.proj.transform(args.coordinate, 'EPSG:3857', 'EPSG:4326');
      const lon = lonlat[0];
      const lat = lonlat[1];
      const configUrl = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&zoom=18&addressdetails=1';
      self.http.get<RootObject>(configUrl).subscribe(data => {
        if (confirm('Czy chcesz dodać oznaczenie dla lokalizacji: ' + data.display_name + '?')) {
          self.addMarker(lon, lat, data.display_name);
        }
      });
    });

    const selectClick = new ol.interaction.Select({
      condition: ol.events.condition.click
    });

    this.map.addInteraction(selectClick);
    selectClick.on('select', function (e) {
      const selectedFeatures = e.target.getFeatures().getArray();
      const featuresStr = selectedFeatures[0];
      if (featuresStr !== undefined) {
        if (confirm('Czy chcesz usunąć oznaczenie dla lokalizacji: ' + featuresStr.N.name + '?')) {
          self.delete(featuresStr);
        }
      }
    });
  }

  addMarker(lon: number, lat: number, name) {
    const iconFeatures = [];

    const iconFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326',
        'EPSG:3857')),
      name: name,
    });

    iconFeature.setId((lon + lat * lat) / lon);
    iconFeatures.push(iconFeature);
    const vectorSource = new ol.source.Vector({
      features: iconFeatures // add an array of features
    });

    this.vectorLayer = new ol.layer.Vector({
      source: vectorSource,
    });

    this.map.addLayer(this.vectorLayer);

  }

  setCenter() {
    const view = this.map.getView();
    view.setCenter(ol.proj.fromLonLat([this.longitude, this.latitude]));
    view.setZoom(8);
  }

  Getgl() {
    this.getConfig();
  }

  getConfig() {
    const text = this.address.split(' ');
    const configUrl = 'https://nominatim.openstreetmap.org/search?q=' + this.CreateString(text) + '&format=json';
    this.http.get<RootObject>(configUrl).subscribe(data => {
      this.list = data;
      const view = this.map.getView();
      if (data !== undefined) {
        view.setCenter(ol.proj.fromLonLat([Number(data[0].lon), Number(data[0].lat)]));
        view.setZoom(12);
      }
      this.addMarker(Number(data[0].lon), Number(data[0].lat), data.display_name);
    });
  }

  CreateString(text) {
    let readyStr = '';
    text.forEach(element => {
      if (readyStr === '') {
        readyStr = element;
      } else {
        readyStr = readyStr + '+' + element;
      }
    });
    return readyStr;
  }

  SetPin(lon, lat, name) {
    const view = this.map.getView();
    view.setCenter(ol.proj.fromLonLat([Number(lon), Number(lat)]));
    view.setZoom(19);
    this.addMarker(Number(lon), Number(lat), name);
  }

  delete(feature?) {
    const layers = this.map.getLayers();
    layers.forEach(element => {
      if (feature !== undefined) {
        const source: OlVectorSource = element.getSource();
        if (source.j[feature.getId()] !== undefined) {
          source.removeFeature(feature);
        }
      }
    });
  }

  delete2() {
    if (confirm('Are you sure to delete ' + 'aaa')) {
      console.log('Implement delete functionality here');
    }
  }

}

export interface Address {
  house_number: string;
  road: string;
  neighbourhood: string;
  town: string;
  county: string;
  state_district: string;
  state: string;
  postcode: string;
  country: string;
  country_code: string;
}

export interface RootObject {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: Address;
  boundingbox: string[];
}

