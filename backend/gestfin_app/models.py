from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
import random
import string
from datetime import timedelta


class Utilisateur(AbstractUser):
    nom_entreprise = models.CharField(max_length=200, blank=True)
    devise = models.CharField(max_length=10, default='FCFA')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    email = models.EmailField(unique=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return self.email



class CodeVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Code de vérification'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} — {self.code}"

    @staticmethod
    def generer_code():
        return ''.join(random.choices(string.digits, k=6))

    def is_expired(self):
        """Code expire après 3 minutes"""
        return timezone.now() > self.created_at + timedelta(minutes=3)

    def is_valid(self, code_saisi):
        """Vérifie le code en moins de 15 secondes après la dernière tentative"""
        if self.verified:
            return False, "Code déjà utilisé."
        if self.is_expired():
            return False, "Code expiré. Demandez un nouveau code."
        if self.attempts >= 3:
            return False, "Trop de tentatives. Demandez un nouveau code."
        self.attempts += 1
        self.save()
        if self.code != code_saisi:
            return False, "Code incorrect."
        self.verified = True
        self.save()
        return True, "Code vérifié avec succès."
    




class Categorie(models.Model):
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
        ('les_deux', 'Les deux'),
    ]
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='categories')
    nom = models.CharField(max_length=100)
    type_categorie = models.CharField(max_length=10, choices=TYPE_CHOICES, default='les_deux')
    couleur = models.CharField(max_length=7, default='#007bff')
    budget_mensuel = models.DecimalField(
        max_digits=15, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Catégorie'
        ordering = ['nom']
        unique_together = ['utilisateur', 'nom']

    def __str__(self):
        return f"{self.nom} ({self.get_type_categorie_display()})"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
    ]
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='transactions')
    type_transaction = models.CharField(max_length=10, choices=TYPE_CHOICES)
    montant = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    date = models.DateField()
    categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, related_name='transactions')
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Transaction'
        ordering = ['-date', '-date_creation']

    def __str__(self):
        signe = '+' if self.type_transaction == 'entree' else '-'
        return f"{self.date} | {signe}{self.montant} FCFA | {self.description[:30]}"


class Dette(models.Model):
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('proche', 'Proche échéance'),
        ('en_retard', 'En retard'),
        ('regle', 'Réglé'),
    ]
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='dettes')
    creancier = models.CharField(max_length=200)
    montant = models.DecimalField(
        max_digits=15, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    montant_rembourse = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    echeance = models.DateField()
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_cours')
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Dette'
        ordering = ['echeance']

    def __str__(self):
        return f"{self.creancier} — {self.montant} FCFA — {self.echeance}"

    @property
    def montant_restant(self):
        return self.montant - self.montant_rembourse

    def update_statut(self):
        from datetime import date, timedelta
        today = date.today()
        if self.montant_rembourse >= self.montant:
            self.statut = 'regle'
        elif self.echeance < today:
            self.statut = 'en_retard'
        elif self.echeance <= today + timedelta(days=7):
            self.statut = 'proche'
        else:
            self.statut = 'en_cours'


class AlerteBudget(models.Model):
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='alertes')
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE, related_name='alertes')
    seuil_pourcentage = models.IntegerField(default=80)
    active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Alerte Budget'
        unique_together = ['utilisateur', 'categorie']

    def __str__(self):
        return f"Alerte {self.categorie.nom} à {self.seuil_pourcentage}%"
