# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# 1️⃣ CAMBIO: Se añadió 'crear_admin' al final de esta línea
from .views import EmprendimientoViewSet, enviar_invitacion_masiva, crear_admin

router = DefaultRouter()
router.register(r'emprendimientos', EmprendimientoViewSet)

urlpatterns = [
    # Declaración de ruta estática para correos masivos
    path('enviar-invitacion/', enviar_invitacion_masiva, name='enviar_invitacion'), 
    
    # 2️⃣ CAMBIO: Se añadió esta ruta para que React no reciba un Error 404
    path('registrar-admin/', crear_admin, name='registrar_admin'),
    
    # Rutas del router e inicio de sesión
    path('', include(router.urls)),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]