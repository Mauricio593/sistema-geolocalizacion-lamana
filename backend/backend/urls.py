from django.contrib import admin
from django.urls import path, include
from django.conf import settings # 👈 Importar settings
from django.conf.urls.static import static # 👈 Importar static
urlpatterns = [
    path('admin/', admin.site.expanded if hasattr(admin.site, 'expanded') else admin.site.urls),
    path('api/', include('api.urls')), # Conectamos las rutas de la API
]

# 👈 AGREGAR ESTO AL FINAL para que Django muestre las imágenes
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)