import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os
from geo.Geoserver import Geoserver
from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
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



# Configuração da pasta de uploads
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


app.config['SECRET_KEY'] = os.urandom(24) # Chave secreta para a sessão
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///imagens.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# --- Modelo do Banco de Dados ---
class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<Usuario {self.username}>'

# Define a estrutura da nossa tabela 'imagens'
class Imagem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False) # Usei 'longitude' como é o padrão

    def __repr__(self):
        return f'<Imagem {self.filename}>'


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        usuario = Usuario.query.filter_by(username=username).first()
        
        if usuario and check_password_hash(usuario.password_hash, password):
            session['usuario_id'] = usuario.id
            session['username'] = usuario.username
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('upload_imagens'))
        else:
            flash('Usuário ou senha incorretos.', 'danger')
            
    return render_template('login.html')

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        usuario_existente = Usuario.query.filter_by(username=username).first()
        
        if usuario_existente:
            flash('Este nome de usuário já existe. Tente outro.', 'warning')
            return redirect(url_for('cadastro'))
            
        hashed_password = generate_password_hash(password)
        novo_usuario = Usuario(username=username, password_hash=hashed_password)
        
        db.session.add(novo_usuario)
        db.session.commit()
        
        flash('Cadastro realizado com sucesso! Faça o login.', 'success')
        return redirect(url_for('login'))
        
    return render_template('cadastro.html')

@app.route('/protegido')
def protegido():
    if 'usuario_id' not in session:
        flash('Você precisa fazer login para acessar esta página.', 'info')
        return redirect(url_for('login'))
    
    return render_template('protegido.html')

@app.route('/logout')
def logout():
    session.pop('usuario_id', None)
    session.pop('username', None)
    flash('Você saiu da sua conta.', 'success')
    return redirect(url_for('login'))


@app.route('/img', methods=['GET', 'POST'])
def upload_imagens():
    if request.method == 'POST':
        # Verifica se a requisição tem a parte de arquivos
        if 'imagens' not in request.files:
            flash('Nenhuma parte de arquivo encontrada na requisição.')
            return redirect(request.url)

        files = request.files.getlist('imagens')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')

        # Validação dos campos de latitude e longitude
        if not latitude or not longitude:
            flash('Latitude e Longitude são campos obrigatórios.')
            return redirect(request.url)
        
        try:
            lat = float(latitude)
            lon = float(longitude)
        except ValueError:
            flash('Latitude e Longitude devem ser números válidos.')
            return redirect(request.url)

        # Processa cada arquivo enviado
        for file in files:
            if file.filename == '':
                flash('Nenhum arquivo selecionado.')
                return redirect(request.url)

            if file:
                # Garante que o nome do arquivo é seguro
                filename = secure_filename(file.filename)
                
                # Salva o arquivo na pasta 'uploads'
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

                # Cria um novo registro no banco de dados
                nova_imagem = Imagem(filename=filename, latitude=lat, longitude=lon)
                db.session.add(nova_imagem)

        # Salva todas as alterações no banco de dados
        db.session.commit()
        
        flash(f'{len(files)} imagens enviadas com sucesso!')
        return redirect(url_for('sucesso'))

    # Se o método for GET, apenas renderiza a página de upload
    return render_template('cadastro_img.html')

@app.route('/sucesso')
def sucesso():
    return render_template('sucesso.html')

@app.route('/lista')
def listar_imagens():
    # Busca todas as imagens no banco de dados, ordenadas pelo ID mais recente
    imagens_db = Imagem.query.order_by(Imagem.id.desc()).all()
    return render_template('lista.html', imagens=imagens_db)

# UPDATE (Editar uma imagem)
@app.route('/imagem/<int:id>/editar', methods=['GET', 'POST'])
def editar_imagem(id):
    # Busca a imagem pelo ID ou retorna erro 404 se não encontrar
    imagem_a_editar = Imagem.query.get_or_404(id)

    if request.method == 'POST':
        # Pega os novos dados do formulário
        nova_latitude = request.form.get('latitude')
        nova_longitude = request.form.get('longitude')

        if not nova_latitude or not nova_longitude:
            flash('Latitude e Longitude são campos obrigatórios.')
            return render_template('editar_imagem.html', imagem=imagem_a_editar)
        
        # Atualiza os campos no objeto do banco de dados
        imagem_a_editar.latitude = float(nova_latitude)
        imagem_a_editar.longitude = float(nova_longitude)
        
        # Salva a alteração
        db.session.commit()
        
        flash('Informações da imagem atualizadas com sucesso!')
        return redirect(url_for('listar_imagens'))

    # Se for GET, apenas mostra o formulário de edição com os dados atuais
    return render_template('editar_imagem.html', imagem=imagem_a_editar)


# DELETE (Deletar uma imagem)
@app.route('/imagem/<int:id>/deletar', methods=['POST'])
def deletar_imagem(id):
    imagem_a_deletar = Imagem.query.get_or_404(id)
    
    # Caminho completo para o arquivo
    caminho_arquivo = os.path.join(app.config['UPLOAD_FOLDER'], imagem_a_deletar.filename)
    
    # 1. Deletar o arquivo físico da pasta 'uploads'
    try:
        os.remove(caminho_arquivo)
    except FileNotFoundError:
        # Se o arquivo não existir por algum motivo, apenas informa no console
        print(f"Aviso: Arquivo {caminho_arquivo} não encontrado para deleção.")
        pass

    # 2. Deletar o registro do banco de dados
    db.session.delete(imagem_a_deletar)
    db.session.commit()
    
    flash(f'Imagem "{imagem_a_deletar.filename}" deletada com sucesso!')
    return redirect(url_for('listar_imagens'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.cli.command("init-db")
def init_db_command():
    """Cria as tabelas do banco de dados."""
    db.create_all()
    print("Banco de dados inicializado com sucesso.")

@app.route('/acesso')
def index():
    if 'usuario_id' in session:
        return redirect(url_for('protegido'))
    return redirect(url_for('login'))


# Rota principal
@app.route('/')
def home():
    layersmult = getlayers()
    imagens_db = Imagem.query.order_by(Imagem.id.desc()).all()
    return render_template("index.html",layers=layersmult,url=geoserver_wms,imagens=imagens_db)



@app.route('/coordenadas')
def coordenadas():
    return render_template('coordenadas.html')

@app.route('/animacao/<string:filename>/360', methods=['GET', 'POST'])
def animacao(filename):

    image=filename
    print(image)
    return render_template('animacao.html', image=image)


if __name__ == '__main__':
    app.run(debug=True)

