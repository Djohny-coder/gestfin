import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','gestfin_project.settings')
django.setup()
from gestfin_app.models import Utilisateur
print('users:', Utilisateur.objects.count())
for u in Utilisateur.objects.all():
    print(u.email, '-', u.username, '- has_password:', bool(u.password))