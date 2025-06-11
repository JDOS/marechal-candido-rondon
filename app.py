import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os
from geo.Geoserver import Geoserver
from flask import Flask, render_template
from owslib.wms import WebMapService

load_dotenv()
username = os.getenv("user")
password = os.getenv("password")


geoserver_url = "https://sistemas.itti.org.br/geoserver/rest/layers"
geoserver_wms="https://sistemas.itti.org.br/geoserver/MCR/wms"



params = {
    "outputFormat": "application/html"
}

response = requests.get(geoserver_url, params = params, auth=HTTPBasicAuth(username, password))

if response.status_code == 200:
    dados = response.json()
    all_layers = dados['layers']['layer'];
    layers = []

    for layer in all_layers:
        if("MCR" in layer["name"]):
            layers.append(layer)
    layers_dsm = []
    layers_ortofoto = []
    layers_geral = []
    for layer in layers:
        if("Ortofoto" in layer["name"]):
            layers_ortofoto.append(layer)

        if("DSM" in layer["name"]):
            layers_dsm.append(layer)
 
    for layer in layers:
        if(layer not in layers_dsm):
            if(layer not in layers_ortofoto):
                layers_geral.append(layer)

    print("dsm",layers_dsm)
else:
    print("Erro:", response.status_code)


def getlayers():
    WORKSPACE = "MCR"
    wms = WebMapService("https://sistemas.itti.org.br/geoserver/MCR/ows?service=WMS&version=1.1.1&request=GetCapabilities")
    list_produts = {}
    for name in wms.contents:
        layer = wms[name]
        if hasattr(layer, 'children') and layer.children:
            nomelayer=str(name).replace(" ","_")
            nomelayer=nomelayer.replace("-", "")
            list_produts[nomelayer]=[]
            for sub in layer.children:
                name=WORKSPACE+":"+sub.name
                tupla=(name,sub.title)
                list_produts[nomelayer].append(tupla)
    return list_produts

#layersmult = getlayers()

app = Flask(__name__)

# Rota principal
@app.route('/')
def home():
    layersmult = getlayers()
    return render_template("index.html",layers=layersmult,url=geoserver_wms)

if __name__ == '__main__':
    app.run(debug=True)

