from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategorieViewSet, basename='categorie')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'dettes', views.DetteViewSet, basename='dette')

urlpatterns = [
    # Auth
    path('auth/connexion/', views.ConnexionView.as_view(), name='connexion'),
    path('auth/inscription/', views.InscriptionView.as_view(), name='inscription'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profil/', views.ProfilView.as_view(), name='profil'),
    path('auth/users/', views.UserListView.as_view(), name='users'),
    
    path('auth/envoyer-code/', views.envoyer_code_verification, name='envoyer_code'),
    path('auth/verifier-code/', views.verifier_code, name='verifier_code'),

    # Dashboard
    path('dashboard/', views.tableau_de_bord, name='dashboard'),
    path('rapports/mensuel/', views.rapport_mensuel, name='rapport_mensuel'),

    # API
    path('', include(router.urls)),
]