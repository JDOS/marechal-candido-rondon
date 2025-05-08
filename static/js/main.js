
import Map from 'https://cdn.skypack.dev/ol/Map';
import View from 'https://cdn.skypack.dev/ol/View';
import ImageLayer from 'https://cdn.skypack.dev/ol/layer/Image.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import ImageWMS from 'https://cdn.skypack.dev/ol/source/ImageWMS.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM';
import TileWMS from 'https://cdn.skypack.dev/ol/source/TileWMS.js';


console.log("Layer:", appData.layer);
console.log("URLS:", appData.url);

    const wmsSource = new ImageWMS({
      url: appData.url,
    //  params: {'LAYERS': "Sanepar:Coberturas vegetais"},
      params: {'LAYERS': appData.layer, 'TILED': true},

      serverType: 'geoserver',
     
    });

 const layer1 =  new TileLayer({
    source: new TileWMS({
      url: appData.url,
      params: {'LAYERS': appData.layer, 'TILED': true},
      serverType: 'geoserver',
      // Countries have transparency, so do not fade tiles:
      transition: 0,
      crossOrigin: 'anonymous',
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

const view = new View({
  center: [-5482713, -2930080],
  zoom: 10,
});

const map = new Map({
  layers: layers,
  target: 'map',
  view: view,
});

// Initial legend
const resolution = map.getView().getResolution();
updateLegend(resolution);

// Update the legend when the resolution changes
map.getView().on('change:resolution', function (event) {
  const resolution = event.target.getResolution();
  updateLegend(resolution);
});

map.on('singleclick', function (evt) {
  document.getElementById('info').innerHTML = '';
  const viewResolution = view.getResolution();
  const url = layer1.getSource().getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
  //  {'INFO_FORMAT': 'text/html'},
    {'INFO_FORMAT': 'application/json'}
  );

  if (url) {
    fetch(url)
      .then((response) => response.json()) // Parse as JSON
      .then((json) => {
        // Extract properties from each feature in the JSON response
        if (json && json.features) {
          const properties = json.features.map(feature => feature.properties); // Extract properties
          console.log(JSON.stringify(properties, null, 2));
          let itens = properties;
          let htmlContent =''

          itens.forEach(item => {
            for (let key in item) {
              console.log(`${key}: ${item[key]}`);
              htmlContent+='<li>'+ `${key}: ${item[key]}`+'</li>';
            }
          });
          
          // Display properties
          //document.getElementById('info').innerHTML = JSON.stringify(properties, null, 2); // Pretty print the properties
          document.getElementById('info').innerHTML = htmlContent;
        } else {
          document.getElementById('info').innerHTML = 'No features found.';
        }
      })
      .catch((error) => {
        console.error('Error fetching feature info:', error);
        document.getElementById('info').innerHTML = 'Error fetching feature info.';
      });
  }
  // if (url) {
  //   fetch(url)
  //     .then((response) => response.text())
  //     .then((html) => {
  //       document.getElementById('info').innerHTML = html;
  //     });
  // }
});



map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const data = layer1.getData(evt.pixel);
  const hit = data && data[3] > 0; // transparent pixels have zero for data[3]
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});