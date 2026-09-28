# backend/api/views.py
import json
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.mail import EmailMessage # 🌟 Usamos EmailMessage para adjuntar archivos
from django.contrib.auth.models import User # 🌟 Importamos el modelo de usuarios de Django

# Importamos tu modelo y tu serializador
from .models import Emprendimiento
from .serializers import EmprendimientoSerializer

# 1. ESTA ES LA CLASE QUE CONTROLA LOS PINES EN EL MAPA
class EmprendimientoViewSet(viewsets.ModelViewSet):
    queryset = Emprendimiento.objects.all()
    serializer_class = EmprendimientoSerializer


# 2. ESTA ES LA FUNCIÓN MEJORADA PARA LOS CORREOS (Con soporte para archivos)
@api_view(['POST'])
def enviar_invitacion_masiva(request):
    asunto = request.data.get('asunto')
    
    # Acepta tanto 'contenido' como 'mensaje' enviado desde React
    contenido = request.data.get('contenido') or request.data.get('mensaje')
    
    # 📁 Recibimos el archivo adjunto si el usuario subió uno desde React
    archivo_adjunto = request.FILES.get('archivo')

    if not asunto or not contenido:
        return Response(
            {"error": "El asunto y el cuerpo del mensaje son obligatorios."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Intenta tomar los correos que envía React. Al usar FormData, llegan como texto JSON
    correos_raw = request.data.get('correos')
    destinatarios = []
    if correos_raw:
        try:
            destinatarios = json.loads(correos_raw)
        except:
            destinatarios = request.data.getlist('correos')

    # Si no vienen desde React, los busca en la Base de Datos
    if not destinatarios:
        lista_emprendimientos = Emprendimiento.objects.exclude(correo__isnull=True).exclude(correo='')
        destinatarios = [emp.correo for emp in lista_emprendimientos]

    if not destinatarios:
        return Response(
            {"message": "No se encontraron correos electrónicos destinatarios para realizar el envío."}, 
            status=status.HTTP_200_OK
        )

    try:
        # 🌟 Creamos el correo usando la clase avanzada de Django
        email = EmailMessage(
            subject=asunto,
            body=contenido,
            from_email=None,
            to=destinatarios,
        )
        
        # 📎 Si subiste un archivo en React, lo adjuntamos al correo
        if archivo_adjunto:
            email.attach(archivo_adjunto.name, archivo_adjunto.read(), archivo_adjunto.content_type)

        # Enviamos el correo
        email.send(fail_silently=False)
        
        return Response(
            {"message": f"¡Éxito! Invitación masiva enviada correctamente a {len(destinatarios)} correos registrados."}, 
            status=status.HTTP_200_OK
        )
        
    except Exception as error:
        return Response(
            {"error": f"Error en el servidor de correo SMTP: {str(error)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# 🌟 3. NUEVA FUNCIÓN: ENCARGADA DE REGISTRAR ADMINISTRADORES DESDE REACT
@api_view(['POST'])
def crear_admin(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    # Validamos que los datos indispensables no vengan vacíos
    if not username or not password:
        return Response(
            {"error": "El nombre de usuario y la contraseña son obligatorios."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Comprobamos que el nombre de usuario esté disponible
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Ya existe un administrador registrado con ese nombre de usuario."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Creamos el usuario encriptando la contraseña automáticamente
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Le otorgamos permisos de staff para que actúe como Administrador
        user.is_staff = True 
        user.save()

        return Response(
            {"mensaje": "Administrador registrado exitosamente."}, 
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {"error": f"Error interno al intentar crear el usuario: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )