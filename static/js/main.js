
import Map from 'https://cdn.skypack.dev/ol/Map';
import View from 'https://cdn.skypack.dev/ol/View';
import ImageLayer from 'https://cdn.skypack.dev/ol/layer/Image.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import ImageWMS from 'https://cdn.skypack.dev/ol/source/ImageWMS.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM';
import TileWMS from 'https://cdn.skypack.dev/ol/source/TileWMS.js';

const appData = {
  url: "https://sistemas.itti.org.br/geoserver/MCR/wms",
  layer: "MCR:Perímetro urbano",
};

const wmsSource = new ImageWMS({
  url: appData.url,
  params: {'LAYERS':  appData.layer},
//  params: {'LAYERS': appData.layer, 'TILED': true},
  serverType: 'geoserver',
  
});


 const layers = [
 new TileLayer({
    source: new OSM(),
  }),
  new ImageLayer({
    extent: [-13884991, 2870341, -7455066, 6338219],
    source: wmsSource,
  }),
];


const updateLegend = function (resolution) {
  const graphicUrl = wmsSource.getLegendUrl(resolution);
  const img = document.getElementById('legend');
  img.src = graphicUrl;
};


const view = new View({
  center:[-6028321.415827398, -2821710.356142848],
  zoom: 12,
});

const map = new Map({
  layers: layers,
  target: 'map',
  view: view,
});


const resolution = map.getView().getResolution();
updateLegend(resolution);


map.getView().on('change:resolution', function (event) {
  const resolution = event.target.getResolution();
  updateLegend(resolution);
});



map.on('singleclick', function (evt) {
  document.getElementById('info').innerHTML = '';
  const viewResolution = view.getResolution();

  // Para guardar as promessas de cada fetch
  const fetchPromises = [];

  wmsLayers.forEach((obj) => {
    const source = obj.layer.getSource();
    if (typeof source.getFeatureInfoUrl === 'function') {
      const url = source.getFeatureInfoUrl(
        evt.coordinate,
        viewResolution,
        'EPSG:3857',
        {'INFO_FORMAT': 'text/html'},
      );  
    if (url) {
      // Adiciona a promessa ao array
      fetchPromises.push(
        fetch(url)
          .then((response) => response.text())
          .then((html) => html)
      );
    }
    }
  });

  // Quando todas as requisições terminarem, mostra o resultado
  Promise.all(fetchPromises).then((results) => {
    // Junta todos os resultados em uma única string
    document.getElementById('info').innerHTML = results.join('<hr>');
  });
});

const wmsLayers = [];

function removeLayerByName(name) {
  const index = wmsLayers.findIndex(item => item.name === name);
  if (index !== -1) {
    map.removeLayer(wmsLayers[index].layer);
    wmsLayers.splice(index, 1);
  }
}

document.addEventListener('change', function(event) {
    if (event.target.type === 'checkbox') {
      if (event.target.checked === true) {
          console.log('Valor:', event.target.value);

         const newwms = new TileLayer({
                          source: new TileWMS({
                            url: appData.url,
                            params: {
                              'LAYERS': event.target.value, 
                              'TILED': true
                            },
                               serverType: 'geoserver',
                              transition: 0,
                             crossOrigin: 'anonymous',
                          })
      });

      map.addLayer(newwms);

       wmsLayers.push({
        name: event.target.value,
        layer: newwms,
      });

    }

      if (event.target.checked === false) {
          removeLayerByName(event.target.value);
      }
    }
 });


function atualizarLayer(novoLayer){
  appData.layer = novoLayer;
  layer1.getSource().updateParams({ 'LAYERS': novoLayer });
}