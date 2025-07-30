
import Map from 'https://cdn.skypack.dev/ol/Map';
import View from 'https://cdn.skypack.dev/ol/View';
import ImageLayer from 'https://cdn.skypack.dev/ol/layer/Image.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import ImageWMS from 'https://cdn.skypack.dev/ol/source/ImageWMS.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM';
import TileWMS from 'https://cdn.skypack.dev/ol/source/TileWMS.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import { fromLonLat } from 'https://cdn.skypack.dev/ol/proj.js';
import Style from 'https://cdn.skypack.dev/ol/style/Style.js';
import Icon from 'https://cdn.skypack.dev/ol/style/Icon.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import GeoJSON from 'https://cdn.skypack.dev/ol/format/GeoJSON';
import Stroke from 'https://cdn.skypack.dev/ol/style/Stroke';
import Fill from 'https://cdn.skypack.dev/ol/style/Fill';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay';


const appData = {
  url: "https://sistemas.itti.org.br/geoserver/MCR/wms",
  layer: "MCR:DISTRITOS_PMMCR_2025",
};

const wmsSource = new ImageWMS({
  url: appData.url,
  params: {'LAYERS':  appData.layer},
//  params: {'LAYERS': appData.layer, 'TILED': true},
  serverType: 'geoserver',
  
});


// Cria a lista de Features a partir dos dados (sem o prefixo 'ol.')
const featuresList = markerDataList.map(function(data) {
    const feature = new Feature({
        geometry: new Point(fromLonLat(data.coords)), // Usa Point e fromLonLat importados
        name: data.name,
        link: data.link
    });

    const iconStyle = new Style({ // Usa Style importado
        image: new Icon({         // Usa Icon importado
            anchor: [0.5, 1],
            src: data.icon,
            scale: 0.01,
        }),
    });
    
    feature.setStyle(iconStyle);
    return feature;
});

// Cria a camada vetorial
const vectorSource = new VectorSource({ // Usa VectorSource importado
    features: featuresList,
});

const vectorLayer = new VectorLayer({ // Usa VectorLayer importado
    source: vectorSource,
});
vectorLayer.setVisible(false);
vectorLayer.setZIndex(100);


const layerToggleCheckbox = document.getElementById('layer-360');


layerToggleCheckbox.addEventListener('change', function() {
    vectorLayer.setVisible(this.checked);
});

// const wmslayercompleto =   new ImageLayer({
//     extent: [-13884991, 2870341, -7455066, 6338219],
//     source: wmsSource,
//   });

//wmslayercompleto.setZIndex(100);

 const layers = [
 new TileLayer({
    source: new OSM(),
  }),

// wmslayercompleto,

  vectorLayer,
];


const updateLegend = function (resolution) {
  wmsLayers.forEach((obj) => {
  const source = obj.layer.getSource();
  const graphicUrl = source.getLegendUrl(resolution);
  const img = document.getElementById('legend');
  img.src = graphicUrl;
  });
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


//const resolution = map.getView().getResolution();
//updateLegend(resolution);


// map.getView().on('change:resolution', function (event) {
//   const resolution = event.target.getResolution();
//   updateLegend(resolution);
// });



const wmsLayers = [];
const leafletGEOJSONLayers = [];
var camadaSelecionada = null;

const estiloPadrao = new Style({
  stroke: new Stroke({ color: 'black', width: 1 }),
  fill: new Fill({ color: 'rgba(54, 54, 255, 0)' })
});
const estiloDestaque = new Style({
  stroke: new Stroke({ color: 'rgba(0, 168, 39, 1)', width: 2 }),
  fill: new Fill({ color: 'rgba(0, 168, 39, 0.45)' })
});

function removeLayerByName(name) {
  const index = wmsLayers.findIndex(item => item.name === name);
  if (index !== -1) {
    map.removeLayer(wmsLayers[index].layer);
    wmsLayers.splice(index, 1);
  }
  const index2 = leafletGEOJSONLayers.findIndex(item => item.name === name);
  if (index2 !== -1) {
    if (leafletGEOJSONLayers[index2].layer) {
      map.removeLayer(leafletGEOJSONLayers[index2].layer);
    }
    leafletGEOJSONLayers.splice(index2, 1);
  }
}

document.addEventListener('change', function(event) {
    if (event.target.type === 'checkbox') {
      if (event.target.checked === true) {
          console.log('Valor:', event.target.value);
          let eventcheck=event.target;

         const newwms = new TileLayer({
                          source: new TileWMS({
                            url: appData.url,
                            params: {
                              'LAYERS': event.target.value, 
                              'TILED': true,
                              'FORMAT': 'image/png8'
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

  //    const resolution = map.getView().getResolution();
  //    updateLegend(resolution);

const baseUrl = 'https://sistemas.itti.org.br/geoserver/MCR/ows';
const typeName = event.target.value;
const geoserverUrl = `${baseUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=${encodeURIComponent(typeName)}&outputFormat=application/json&srsName=EPSG:4326`;
adicionarGeoJSONLayer(typeName,geoserverUrl,estiloPadrao,estiloDestaque,map,eventcheck);
// Função para adicionar camada GeoJSON se ainda não existir



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


// Mudar o cursor ao passar por cima de um marcador
map.on('pointermove', function (e) {
    const pixel = map.getEventPixel(e.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);
    map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

// Lógica do clique no marcador
map.on('click', function (e) {
    // A peça-chave: itera sobre cada feature no pixel clicado
    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        // Pega a propriedade 'link' que armazenamos no feature
        const link = feature.get('link');
        
        if (link) {
            // Abre o link em uma nova aba do navegador
            window.open(link, '_blank');
        }
    });
});


const popupElement = document.getElementById('popup');
const popupOverlay = new Overlay({
  element: popupElement,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -20]
});
map.addOverlay(popupOverlay);


function adicionarGeoJSONLayer(layerName, geoserverUrl, estiloPadrao, estiloDestaque, map,eventcheck) {
  if (!leafletGEOJSONLayers.find(item => item.name === layerName)) {
    fetch(geoserverUrl)
      .then(response => response.json())
      .then(data => {
        if (!data || !data.features || data.features.length === 0) {
          console.log("GeoJSON recebido, mas sem 'features'.");
          map.getView().setCenter(ol.proj.fromLonLat([-47.92, -15.78]));
          map.getView().setZoom(4);
          return;
        }

        // Função de estilo dinâmica
        const styleFunction = function(feature) {
          // Se a feature está selecionada, aplica o estilo de destaque
          if (camadaSelecionada && camadaSelecionada === feature) {
            return estiloDestaque;
          }
          return estiloPadrao;
       };

        // Fonte vetorial
        const vectorSource = new VectorSource({
          features: new GeoJSON().readFeatures(data, {
            featureProjection: 'EPSG:3857'
          })
        });

        // Camada vetorial
        const vectorLayer = new VectorLayer({
          source: vectorSource,
          style: styleFunction
        });

        vectorLayer.set('name', layerName); // Para facilitar busca/remover depois

        // Evento de clique nas features
        map.on('singleclick', function(evt) {
          let featureFound = false;
          map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
            if (layer === vectorLayer) {
              featureFound = true;
              // Atualiza seleção
              camadaSelecionada = feature;
              vectorLayer.changed(); // Força re-render para aplicar o estilo

              // Monta popup
              let popupContent = "";
              popupContent = "<h4>"+layerName+"</h4>"
              const props = feature.getProperties();
              let contador = 0;
              for (const key in props) {
                contador += 1;
                if (
                  key.toUpperCase() === "SHAPE_AREA" ||
                  key === "Área__m²" ||
                  key === "Área_m2" ||
                  key === "Área_m²"
                ) {
                  popupContent += `<b>Área:</b> ${props[key].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²<br>`;
                } 
                else if (key=="geometry" || key=="CLASSE" || key.toUpperCase()=="NOME_QTDES" || key=="id"){
                 //pass
                }
                else if (key == "Área_ha"){
                   popupContent += `<b>Área:</b> ${props[key].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha<br>`;
                }
                else if (key== "NmDistrito" || key =="CdMunicipi" || key=="CdRegiaoMe" || key=="AreaMetros"){
                   popupContent += `<b>${key}:</b> ${props[key]}<br>`;
                }
                else if (key=="area_km2"){
                  popupContent += `<b>Área:</b> ${props[key].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km²<br>`;
                }
                else if (key=="NmCompleto"){
                  popupContent += `<b>Nome:</b> ${props[key]}<br>`;
                }
                else if (key=="municipio"){
                  popupContent += `<b>Município:</b> ${props[key]}<br>`;
                }
                else if (key=="Shape_Leng"){
                  popupContent += `<b>Comprimento de Shape:</b> ${props[key].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²<br>`;
                }
                else if (key=="codibge"){
                  popupContent += `<b>Código IBGE:</b> ${props[key]}<br>`;
                }
                else if  (props[key]!=0) {
                    popupContent += `<b>${key}:</b> ${props[key]}<br>`;
                }

      
                else if  (key!=null || key != '' || key!='null' ||props[key]==0||props[key]=="0") {
                    
                }
                 else {
                   popupContent += `<b>${key}:</b> ${props[key]}<br>`;
                 }
              }

              // Exibe popup (usando overlay do OpenLayers)
              popupOverlay.setPosition(evt.coordinate);
              popupElement.innerHTML = popupContent;
            }
          });
          // Se clicou fora de qualquer feature, remove seleção
          if (!featureFound) {
            camadaSelecionada = null;
            vectorLayer.changed();
            popupOverlay.setPosition(undefined);
          }
        });

        // Adiciona camada ao mapa e ao array de controle
        if(eventcheck.checked === true){
            map.addLayer(vectorLayer);
            leafletGEOJSONLayers.push({ name: layerName, layer: vectorLayer });
        }
        
       
      });
  }
}