
import Map from 'https://cdn.skypack.dev/ol/Map';
import View from 'https://cdn.skypack.dev/ol/View';
import ImageLayer from 'https://cdn.skypack.dev/ol/layer/Image.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile';
import ImageWMS from 'https://cdn.skypack.dev/ol/source/ImageWMS.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM';
import TileWMS from 'https://cdn.skypack.dev/ol/source/TileWMS.js';


console.log("Layer:", appData.layer);
console.log("URLS:", appData.url);

    const wmsSource = new ImageWMS({
      url: appData.url,
    //  params: {'LAYERS': "Sanepar:Coberturas vegetais"},
      params: {'LAYERS': appData.layer, 'TILED': true},
      ratio: 1,
      serverType: 'geoserver',
    });

 const layer1 =  new TileLayer({
    source: new TileWMS({
      url: appData.url,
      params: {'LAYERS': appData.layer, 'TILED': true},
      serverType: 'geoserver',
      // Countries have transparency, so do not fade tiles:
      transition: 0,
    }),
  })


const updateLegend = function (resolution) {
  const graphicUrl = wmsSource.getLegendUrl(resolution);
  const img = document.getElementById('legend');
  img.src = graphicUrl;
};

const layers = [
  new TileLayer({
    source: new OSM(),
  }),
  new ImageLayer({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: wmsSource,
  }),
  layer1,
];

const map = new Map({
  layers: layers,
  target: 'map',
  view: new View({
    center: [-5482713, -2930080],
    zoom: 10,
  }),
});

// Initial legend
const resolution = map.getView().getResolution();
updateLegend(resolution);

// Update the legend when the resolution changes
map.getView().on('change:resolution', function (event) {
  const resolution = event.target.getResolution();
  updateLegend(resolution);
});
