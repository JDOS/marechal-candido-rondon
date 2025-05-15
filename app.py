import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os
from geo.Geoserver import Geoserver
from flask import Flask, render_template


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
            print(layer["name"])

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

print("Testando meus layers")



app = Flask(__name__)

# Rota principal
@app.route('/')
def home():
    return render_template("index.html",layers=layers,layers_geral=layers_geral,layers_dsm=layers_dsm,layers_ortofoto=layers_ortofoto,url=geoserver_wms)

# @app.route('/esri')
# def esri():
#     return render_template("esri-map.html")

# @app.route('/coo')
# def coo():
#     return render_template("coordenadas.html")


# @app.route('/geoserver')
# def geoserver():
#     return render_template("esri-geoserver.html")

# Outra rota
# @app.route('/sobre')
# def sobre():
#     return "<h2>Sobre o projeto</h2><p>Feito com Flask!</p>"

if __name__ == '__main__':
    app.run(debug=True)

