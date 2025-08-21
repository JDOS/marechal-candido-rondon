from django.db import models

class Fotos(models.Model):
    nome = models.CharField(max_length=255, blank=False, null=False)
    latitude = models.FloatField(blank=False, null=False)
    longitude = models.FloatField(blank=False, null=False)
    foto = models.ImageField(upload_to='fotos360/', blank=True)

    def __str__(self): 
        return self.nome

