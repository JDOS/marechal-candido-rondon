from django.shortcuts import render
from dotenv import load_dotenv
import os
from geo.Geoserver import Geoserver
from owslib.wms import WebMapService
from .models import Fotos

load_dotenv()

username = os.getenv("GEOSERVER_USER")
password = os.getenv("GEOSERVER_PWD")
geoserver_url = os.getenv("GEOSERVER_URL")
GEOSERVER_WMS=os.getenv("GEOSERVER_WMS")
WORKSPACE = os.getenv("WORKSPACE")
GEOSERVER_CAPABILITIES = os.getenv("GEOSERVER_CAPABILITIES")

def getlayers():
    try:
        wms = WebMapService(GEOSERVER_CAPABILITIES)
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
    
    except Exception as e:
        print("Erro de conexão ao servidor geoserver: ",e)

def index(request):
    layers = getlayers()
    fotos = Fotos.objects.all()
    return render(request, 'sig/index.html', {'layers': layers, 'geoserver_wms': GEOSERVER_WMS, 'imagens': fotos})

def imagem360(request, foto_id):
    imagem = Fotos.objects.get(id=foto_id)
    return render(request, 'sig/imagem360.html', {'imagem': imagem})