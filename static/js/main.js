
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

 let layer1 =  new TileLayer({
    source: new TileWMS({
      url: appData.url,
      params: {'LAYERS': appData.layer, 'TILED': true},
      serverType: 'geoserver',
      // Countries have transparency, so do not fade tiles:
      transition: 0,
      crossOrigin: 'anonymous',
    }),
  })

  

  document.getElementById('layersSelect1').addEventListener('change', function () {
    const novaLayer = this.value;
    atualizarLayer(novaLayer);
  });

    document.getElementById('layersSelect2').addEventListener('change', function () {
    const novaLayer = this.value;
    atualizarLayer(novaLayer);
  });

      document.getElementById('layersSelect3').addEventListener('change', function () {
    const novaLayer = this.value;
    atualizarLayer(novaLayer);
  });

  function atualizarLayer(novoLayer){
    appData.layer = novoLayer;
    layer1.getSource().updateParams({ 'LAYERS': novoLayer });
  }

const updateLegend = function (resolution) {
  const graphicUrl = wmsSource.getLegendUrl(resolution);
  const img = document.getElementById('legend');
  img.src = graphicUrl;
};

const layers = [
 new TileLayer({
    source: new OSM(),
  }),
  // new Layer({
  //     source: new Source({
  //       attributions:
  //         'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
  //         'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
  //       url:
  //         'https://server.arcgisonline.com/ArcGIS/rest/services/' +
  //         'World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  //     }),
  //   }),

  new ImageLayer({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: wmsSource,
  }),
  layer1,
];

const view = new View({
  center: [-6018157.509443143, -2821599.328614264],
  zoom: 12,
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
  console.log();
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

           console.log(itens);
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
