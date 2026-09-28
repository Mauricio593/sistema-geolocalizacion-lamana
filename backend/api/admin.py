from django.contrib import admin
from .models import Emprendimiento

# Registramos el modelo para que Django lo muestre en el panel visual
admin.site.register(Emprendimiento)