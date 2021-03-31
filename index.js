import 'ol/ol.css';
import 'ol-layerswitcher/src/ol-layerswitcher.css';
import { Map, View, Feature, Overlay, Graticule } from 'ol/index';
import { fromLonLat, toLonLat, useGeographic, transform } from 'ol/proj';
import { toStringHDMS } from 'ol/coordinate';
import { defaults as defaultControls, ZoomToExtent, ScaleLine, ZoomSlider, Attribution, FullScreen, Control, MousePosition } from 'ol/control';
import { Circle as CircleStyle, Circle, Icon, Fill, Stroke, Style, Text } from 'ol/style';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';
import { Tile as TileLayer, Vector as VectorLayer, LayerTile } from 'ol/layer';
import { ImageArcGISRest, TileArcGISRest, XYZ, OSM, Stamen, BingMaps } from 'ol/source';
import LayerSwitcher from 'ol-layerswitcher';
import LayerGroup from 'ol/layer/Group';
import LayerImage from 'ol/layer/Image';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import TileJSON from 'ol/source/TileJSON';

//@Copyright 
var attribution = new Attribution({
    collapsible: true
});

//POPUP

/**
* Elements that make up the popup.
*/

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

/**
* Create an overlay to anchor the popup to the map.
*/

var overlay = new Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
        duration: 250
    }
});

/**
* Add a click handler to hide the popup.
* @return {boolean} Don't follow the href.
*/

closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};


//RASTER 
var openst = new TileLayer({
    title: 'OpenStreetMap',
    type: 'base',
    combine: false,
    visible: true,
    source: new OSM({
        wrapX: false
    })
});

var stamentoner = new TileLayer({
    title: 'Stamen Toner',
    type: 'base',
    combine: false,
    visible: false,
    source: new Stamen({
        layer: 'toner',
        wrapX: false
    })
});

// combined layers watercolor1 + terrain labels 
var watercolor1 = new TileLayer({
    title: 'Stamen No Labels',
    //type: 'base', 
    visible: true,
    source: new Stamen({
        layer: 'watercolor',
        wrapX: false
    })
});

var terrainlabels = new TileLayer({
    title: 'Stamen With Labels',
    //type: 'base',  
    visible: true,
    source: new Stamen({
        layer: 'terrain-labels',
        wrapX: false
    })
});

var bingsat = new TileLayer({
    title: 'Bing',
    type: 'base',
    combine: false,
    visible: false,
    source: new BingMaps({
        key: 'AmMSiUpOokUvbXi9sfQbdzPJQqpZ-9ZTMPJ-0uhNsB8cF3H4RMVSSuh4CTTeh2yG',
        //de generat alt key. Nu puneti in production cu acest key!
        imagerySet: 'Aerial', //('Aerial','AerialWithLabels','Road')
        wrapX: false
    })
});


// graticule  
var grati = new Graticule({
    //title: 'Graticule', 
    combine: true,
    visible: true,
    opaque: false,
    // the style to use for the lines, optional. 
    strokeStyle: new Stroke({
        color: 'rgba(255,120,0,0.9)',
        width: 1.5,
        lineDash: [0.5, 4]
    }),
    showLabels: true,
    wrapX: false
});

//ArcGIS Rest Services

var restapielevtile = new TileLayer({
    title: 'Elevation Tile',
    visible: false,
    source: new TileArcGISRest({
        ratio: 1,
        params: { 'LAYERS': 'show:0' },
        url: "https://elevation.arcgis.com/arcgis/rest/services/WorldElevation/DataExtents/MapServer"
    })

});

var restapielevimage = new LayerImage({
    title: 'Elevation Image',
    visible: false,
    source: new ImageArcGISRest({
        ratio: 1,
        params: { 'LAYERS': 'show:0' },
        url: "https://elevation.arcgis.com/arcgis/rest/services/WorldElevation/DataExtents/MapServer"
    })
});

var restapiearthq = new LayerImage({
    title: 'Cutremure dupa 1970',
    visible: false,
    source: new ImageArcGISRest({
        ratio: 1,
        params: { 'LAYERS': 'show:0' },
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Earthquakes_Since1970/MapServer"
    })
});

var restapistreet = new LayerImage({
    title: 'World Street Map',
    visible: false,
    source: new ImageArcGISRest({
        ratio: 1,
        params: { 'LAYERS': 'show:0' },
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer"
    })
});

//VECTORI 

var vector4wfs = new VectorLayer({
    title: 'WFS 4 - World',
    visible: false,
    source: new VectorSource({
        format: new GeoJSON(),
        url: function (extent) {
            return 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
                'version=1.1.0&request=GetFeature&typename=opengeo:countries&' +
                'outputFormat=application/json&srsname=EPSG:4326&' +
                'bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: bboxStrategy,
        crossOrigin: 'anonymous'
    }),
    style: new Style({
        fill: new Fill({
            color: [105, 107, 41, 0.1]
        }),
        stroke: new Stroke({
            color: 'rgba(107, 99, 89, 1.0)',
            width: 0.5
        })
    })
});

//Style Countries (label si vectors) 
var styletext = new Style({
    text: new Text({
        font: '10px "Open Sans", "Arial Unicode MS", "sans-serif"',
        placement: 'point',
        overflow: true,
        fill: new Fill({
            color: 'black'
        }),
        stroke: new Stroke({
            color: '#fff',
            width: 3
        })
    })
});

var countryStyle = new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new Stroke({
        color: '#319FD3',
        width: 1
    })
});

var stylecountrylabel = [styletext, countryStyle];

var vector100 = new VectorLayer({
    title: 'Countries WFS',
    visible: false,
    source: new VectorSource({
        format: new GeoJSON(),
        url: function (extent) {
            return 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
                'version=1.1.0&request=GetFeature&typename=opengeo:countries&' +
                'outputFormat=application/json&srsname=EPSG:4326&' +
                'bbox=' + extent.join(',') + ',EPSG:3857';
        },
        strategy: bboxStrategy,
        crossOrigin: 'anonymous'
    }),
    style: function (feature) {
        styletext.getText().setText(feature.get('sovereignt'));
        return stylecountrylabel;
    },
    declutter: true
});

//PICTURE IN POPUP

var styleCache = {};
var fondsdeguerre2 = new VectorLayer({
    title: 'Fonds de guerre 2',
    name: 'Fonds de guerre 14-18',
    visible: false,
    source: new VectorSource({
        format: new GeoJSON(),
        projection: 'EPSG:3857',
        url: 'https://viglino.github.io/ol-ext/examples/data/fond_guerre.geojson',
        crossOrigin: 'anonymous',
        strategy: bboxStrategy,
        attributions: ["&copy; <a href='https://data.culture.gouv.fr/explore/dataset/fonds-de-la-guerre-14-18-extrait-de-la-base-memoire'>data.culture.gouv.fr</a>"],
        logo: 'https://www.data.gouv.fr/s/avatars/37/e56718abd4465985ddde68b33be1ef.jpg'
    }),
    declutter: true,
    style: function (feature) {
        var size = 50;
        var style = styleCache[size];
        if (!style) {
            style = new Style({
                image: new CircleStyle({
                    radius: 7,
                    stroke: new Stroke({
                        color: '#fff'
                    }),
                    fill: new Fill({
                        color: '#3399CC'
                    }),
                    snapToPixel: false
                }),
                text: new Text({
                    //text: "Distance "+ size.toString(),
                    fill: new Fill({
                        color: '#000'
                    })
                })
            });
            //styleCache[size] = style;
        };
        style.getText().setText(feature.get('commune'));
        return style;
    }
});

//LOCAL GEOJSON


//style

var image1 = new CircleStyle({
    radius: 5,
    fill: new Fill({
        color: [10, 15, 145, 0.5]
    }),
    stroke: new Stroke({
        color: 'red',
        width: 1
    })
});

var styles = {
    'Point': new Style({
        image: image1
    }),
    'LineString': new Style({
        stroke: new Stroke({
            color: 'red',
            width: 2
        })
    }),
    'Polygon': new Style({
        stroke: new Stroke({
            color: 'blue',
            lineDash: [5],
            width: 2
        }),

        fill: new Fill({
            color: 'rgba(145, 50, 255, 0.5)'
        })
    })
};


var styleFunction = function (feature) {
    return styles[feature.getGeometry().getType()];
};



//geojson

var geojsonObject = {
    'type': 'FeatureCollection',
    'crs': { 'type': 'name', 'properties': { 'name': 'EPSG:4326' } },
    'features': [
        { 'type': 'Feature', 'properties': { 'name': 'Saguenay (Arrondissement Latterière)', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([-2.768477, 47.527715]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Canton Tremblay', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([-3.473566, 48.611386]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Saint-Félix-dOtis', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([1.065347, 47.792556]) } },
        { 'type': 'Feature', 'properties': { 'name': 'La Baie', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([7.305065, 47.553403]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Saint-David-de-Falardeau', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([2.46776, 49.14392]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Saint-Honoré-de-Chicoutimi', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([-1.530367, 49.217813]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Alma', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([2.514013, 49.742959]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Jonquière', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([4.856938, 49.124191]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Chicoutimi', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Point', 'coordinates': fromLonLat([3.571785, 49.338168]) } },
        { 'type': 'Feature', 'properties': { 'name': 'Chicou', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'LineString', 'coordinates': [fromLonLat([3.571785, 49.338168]), fromLonLat([4.856938, 49.124191])] } },
        { 'type': 'Feature', 'properties': { 'name': 'Saint-deDavid', 'linkx': "<a href='https://en.wikipedia.org/wiki/Pretoria'/>Pretoria</a>", 'flag': "<center><img src=https://png-5.findicons.com/files/icons/282/flags/48/canada.png \/><center>" }, 'geometry': { 'type': 'Polygon', 'coordinates': [[fromLonLat([-3.473566, 48.611386]), fromLonLat([1.065347, 47.792556]), fromLonLat([3.571785, 49.338168])]] } }
    ]
};


//layer

var vectorSource = new VectorSource({
    features: (new GeoJSON()).readFeatures(geojsonObject)
});
var localgeojson = new VectorLayer({
    title: 'Local Geojson',
    source: vectorSource,
    visible: false,
    style: styleFunction,
    declutter: true
});

//END LOCAL GEOJSON


//AFISARE HARTA 

const map = new Map({
    target: 'map',
    overlays: [overlay],
    layers: [
        new LayerGroup({
            'title': 'Base maps',
            layers: [bingsat, stamentoner, openst,
                new LayerGroup({
                    title: 'Stamen color with labels',
                    type: 'base',
                    combine: true,
                    visible: false,
                    layers: [watercolor1, terrainlabels]
                }),
                grati]
        }),
        new LayerGroup({
            title: 'Overlays',
            layers: [restapistreet, restapielevtile, restapielevimage, restapiearthq, vector100, vector4wfs, fondsdeguerre2, localgeojson]
        })
    ],
    view: new View({
        projection: 'EPSG:3857',
        center: transform([12.5359979, 41.9100711], 'EPSG:4326', 'EPSG:3857'),
        zoom: 2
    }),
    controls: defaultControls({ attribution: false }).extend([
        new ZoomSlider(),
        new ZoomToExtent({
            extent: transform([11847730.116737, 1749516.199121,
                13119643.648371, 854286.622203], 'EPSG:3857', 'EPSG:4326')
        }),
        new ScaleLine({ units: 'metric' }),
        new FullScreen(),
        attribution
    ])
});
var layerSwitcher = new LayerSwitcher();
map.addControl(layerSwitcher);


// Handler

/**
* Add a click handler to the map to render the popup.
*/

map.on('singleclick', function (evt) {
    if (map.hasFeatureAtPixel(evt.pixel) === true) {
        var coordinate = evt.coordinate;
        var hdms = toStringHDMS(toLonLat(coordinate));
        var feature = map.getFeaturesAtPixel(evt.pixel)[0];

        var continut = feature.get('name');
        var continut1 = feature.get('linkx');
        var continut2 = feature.get('flag');
        var continut3 = feature.get('linkx');

        //var continut = feature.get('region');
        //var continut1 = feature.get('link');
        //var continut2 = feature.get('img');
        //var continut3 = feature.get('copy');

        content.innerHTML = '<b>Salut!</b><br /><center><img src=' + continut2 + ' \/><center>' + '<br />Locatia aleasa este: ' + continut + '<code><br />(' + hdms + ')</code>' + '<br />Detalii: ' + continut3;
        overlay.setPosition(coordinate);
    } else {
        overlay.setPosition(undefined);
        closer.blur();
    }

});


map.on('pointermove', function (evt) {
    if (map.hasFeatureAtPixel(evt.pixel)) {
        map.getViewport().style.cursor = 'pointer';
    } else {

        map.getViewport().style.cursor = 'inherit';
    }
});