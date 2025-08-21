from django.urls import path
from sig.views import index, imagem360

urlpatterns = [
    path('', index, name='index'),
    path('imagem360/<int:foto_id>', imagem360, name='imagem360'),
]