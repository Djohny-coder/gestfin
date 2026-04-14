from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur, Categorie, Transaction, Dette, AlerteBudget


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'nom_entreprise', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'nom_entreprise']
    fieldsets = UserAdmin.fieldsets + (
        ('Infos GestFin', {'fields': ('nom_entreprise', 'devise')}),
    )


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ['nom', 'type_categorie', 'utilisateur', 'budget_mensuel']
    list_filter = ['type_categorie']
    search_fields = ['nom', 'utilisateur__email']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'description', 'type_transaction', 'montant', 'categorie', 'utilisateur']
    list_filter = ['type_transaction', 'date']
    search_fields = ['description', 'utilisateur__email']
    date_hierarchy = 'date'


@admin.register(Dette)
class DetteAdmin(admin.ModelAdmin):
    list_display = ['creancier', 'montant', 'echeance', 'statut', 'utilisateur']
    list_filter = ['statut']
    search_fields = ['creancier', 'utilisateur__email']


@admin.register(AlerteBudget)
class AlerteBudgetAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'categorie', 'seuil_pourcentage', 'active']
