from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Categorie, Transaction, Dette, AlerteBudget

User = get_user_model()


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'nom_entreprise', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        data['email'] = data['email'].strip().lower()
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        email = validated_data['email']
        username = email.split('@')[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        user = User(username=username, **validated_data)
        user.set_password(password)
        user.save()
        return user


class UtilisateurSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'nom_entreprise', 'devise', 'is_staff']
        read_only_fields = ['id', 'email', 'is_staff']


class UtilisateurCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    is_staff = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'password2', 'devise', 'is_staff']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        data['email'] = data['email'].strip().lower()
        return data

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Cet email est déjà utilisé.')
        return value

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        email = validated_data['email']
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        user = User(username=username, **validated_data)
        user.set_password(password)
        user.save()

        categories_defaut = [
            {'nom': 'Ventes', 'type_categorie': 'entree', 'couleur': '#28a745'},
            {'nom': 'Prestations', 'type_categorie': 'entree', 'couleur': '#17a2b8'},
            {'nom': 'Achats', 'type_categorie': 'sortie', 'couleur': '#dc3545'},
            {'nom': 'Charges fixes', 'type_categorie': 'sortie', 'couleur': '#fd7e14'},
            {'nom': 'Alimentation', 'type_categorie': 'sortie', 'couleur': '#ffc107', 'budget_mensuel': 200000},
            {'nom': 'Transport', 'type_categorie': 'sortie', 'couleur': '#6f42c1'},
            {'nom': 'Divers', 'type_categorie': 'les_deux', 'couleur': '#6c757d'},
        ]
        for cat in categories_defaut:
            Categorie.objects.create(utilisateur=user, **cat)

        return user


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'type_categorie', 'couleur', 'budget_mensuel', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class TransactionSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    categorie_couleur = serializers.CharField(source='categorie.couleur', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'type_transaction', 'montant', 'date',
            'categorie', 'categorie_nom', 'categorie_couleur',
            'description', 'date_creation'
        ]
        read_only_fields = ['id', 'date_creation']

    def validate_categorie(self, value):
        request = self.context.get('request')
        if value and value.utilisateur != request.user:
            raise serializers.ValidationError("Catégorie invalide.")
        return value


class DetteSerializer(serializers.ModelSerializer):
    montant_restant = serializers.ReadOnlyField()

    class Meta:
        model = Dette
        fields = [
            'id', 'creancier', 'montant', 'montant_rembourse',
            'montant_restant', 'echeance', 'statut', 'description',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['id', 'date_creation', 'date_modification', 'montant_restant']


class AlerteBudgetSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)

    class Meta:
        model = AlerteBudget
        fields = ['id', 'categorie', 'categorie_nom', 'seuil_pourcentage', 'active']
        read_only_fields = ['id']
