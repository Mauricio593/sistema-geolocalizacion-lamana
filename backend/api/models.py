from django.db import models

class Emprendimiento(models.Model):
    
    nombres = models.CharField(max_length=100)
    
    apellidos = models.CharField(max_length=100)
    
    cedula = models.CharField(max_length=10, unique=False)
    
    # Se cambió de EmailField a CharField para evitar la validación interna de Django
    correo = models.CharField(max_length=255, blank=True, null=True)
    
    celular = models.CharField(max_length=10, blank=True, null=True)
    
    ubicacion = models.CharField(max_length=255) # Dirección escrita
    
    nombre_emprendimiento = models.CharField(max_length=200)
    
    actividad = models.CharField(max_length=200)

    # Coordenadas sin validación de límites
    latitud = models.FloatField(null=True, blank=True)
    longitud = models.FloatField(null=True, blank=True)

    # 📸 NUEVOS CAMPOS: Permitir hasta 3 imágenes por emprendimiento
    imagen_1 = models.ImageField(upload_to='emprendimientos/', null=True, blank=True)
    imagen_2 = models.ImageField(upload_to='emprendimientos/', null=True, blank=True)
    imagen_3 = models.ImageField(upload_to='emprendimientos/', null=True, blank=True)

    def __str__(self):
        return f"{self.nombre_emprendimiento} - {self.nombres} {self.apellidos}"