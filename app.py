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
geoserver_wms="https://sistemas.itti.org.br/geoserver/Sanepar/wms"



params = {
    "outputFormat": "application/html"
}

response = requests.get(geoserver_url, params = params, auth=HTTPBasicAuth(username, password))

if response.status_code == 200:
    dados = response.json()
    layers = dados['layers']['layer'];
    # for layer in layers:
    # 	print(layer["name"])
else:
    print("Erro:", response.status_code)

print("Testando meus layers")

print(layers[66])

app = Flask(__name__)

# Rota principal
@app.route('/')
def home():
    return render_template("index.html",layers=layers,url=geoserver_wms)

@app.route('/esri')
def esri():
    return render_template("esri-map.html")

@app.route('/geoserver')
def geoserver():
    return render_template("esri-geoserver.html")

# Outra rota
@app.route('/sobre')
def sobre():
    return "<h2>Sobre o projeto</h2><p>Feito com Flask!</p>"

if __name__ == '__main__':
    app.run(debug=True)

