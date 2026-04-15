import code

from rest_framework import generics, viewsets, status, filters, serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission, SAFE_METHODS
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import date, timedelta
from decimal import Decimal
import calendar

User = get_user_model()

from .models import Categorie, Transaction, Dette, AlerteBudget, CodeVerification
from .serializers import (
    InscriptionSerializer, UtilisateurSerializer, UtilisateurCreateSerializer,
    CategorieSerializer, TransactionSerializer,
    DetteSerializer, AlerteBudgetSerializer
)

class IsAdminOrReadOnly(BasePermission):
    """Autorise la lecture pour tous les utilisateurs connectés, l'écriture seulement pour l'administrateur."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsAdminOnly(BasePermission):
    """Autorise l'accès uniquement aux utilisateurs administrateurs."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class CustomTokenSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email et mot de passe requis.')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        
        if not user.check_password(password):
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        
        if not user.is_active:
            raise serializers.ValidationError('Compte désactivé.')
        
        # Le champ username_field est 'email', donc attrs['email'] est déjà défini
        # Pas besoin de définir attrs[User.USERNAME_FIELD] car c'est déjà 'email'
        
        return super().validate(attrs)
    
class ConnexionView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
    permission_classes = [AllowAny]



class InscriptionView(generics.CreateAPIView):
    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        verification_id = request.data.get('verification_id')

        # En mode debug, permettre inscription sans vérification
        if settings.DEBUG and not verification_id:
            pass  # Skip verification
        else:
            # Vérifier que l'email a bien été validé
            try:
                verification = CodeVerification.objects.get(
                    id=verification_id, email=email, verified=True
                )
            except CodeVerification.DoesNotExist:
                return Response(
                    {'error': 'Email non vérifié. Veuillez valider votre email d\'abord.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        if not settings.DEBUG or verification_id:
            # Supprimer le code utilisé
            verification.delete()

        # Créer des catégories par défaut
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

        return Response(
            {'message': 'Compte créé avec succès.', 'user': UtilisateurSerializer(user).data},
            status=status.HTTP_201_CREATED
        )

class ProfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOnly]

    def get_queryset(self):
        return User.objects.filter(nom_entreprise=self.request.user.nom_entreprise).order_by('-date_joined')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UtilisateurCreateSerializer
        return UtilisateurSerializer

    def perform_create(self, serializer):
        serializer.save(nom_entreprise=self.request.user.nom_entreprise, is_staff=False)


class CategorieViewSet(viewsets.ModelViewSet):
    serializer_class = CategorieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Categorie.objects.filter(utilisateur=self.request.user)

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'categorie__nom']
    ordering_fields = ['date', 'montant', 'date_creation']
    ordering = ['-date', '-date_creation']

    def get_queryset(self):
        qs = Transaction.objects.filter(utilisateur=self.request.user).select_related('categorie')
        type_t = self.request.query_params.get('type')
        if type_t in ['entree', 'sortie']:
            qs = qs.filter(type_transaction=type_t)
        mois = self.request.query_params.get('mois')
        annee = self.request.query_params.get('annee')
        if mois and annee:
            qs = qs.filter(date__month=mois, date__year=annee)
        elif annee:
            qs = qs.filter(date__year=annee)
        cat = self.request.query_params.get('categorie')
        if cat:
            qs = qs.filter(categorie__id=cat)
        return qs

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)


class DetteViewSet(viewsets.ModelViewSet):
    serializer_class = DetteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Dette.objects.filter(utilisateur=self.request.user)
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def perform_create(self, serializer):
        dette = serializer.save(utilisateur=self.request.user)
        dette.update_statut()
        dette.save()

    def perform_update(self, serializer):
        dette = serializer.save()
        dette.update_statut()
        dette.save()

    @action(detail=True, methods=['post'])
    def rembourser(self, request, pk=None):
        dette = self.get_object()
        montant = Decimal(str(request.data.get('montant', 0)))
        if montant <= 0:
            return Response({'error': 'Montant invalide'}, status=400)
        dette.montant_rembourse = min(dette.montant, dette.montant_rembourse + montant)
        dette.update_statut()
        dette.save()
        return Response(DetteSerializer(dette).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tableau_de_bord(request):
    user = request.user
    today = date.today()
    mois_actuel = today.month
    annee_actuelle = today.year

    # Totaux du mois
    transactions_mois = Transaction.objects.filter(
        utilisateur=user,
        date__month=mois_actuel,
        date__year=annee_actuelle
    )
    revenus_mois = transactions_mois.filter(type_transaction='entree').aggregate(
        total=Sum('montant'))['total'] or Decimal('0')
    depenses_mois = transactions_mois.filter(type_transaction='sortie').aggregate(
        total=Sum('montant'))['total'] or Decimal('0')

    # Mois précédent
    if mois_actuel == 1:
        mois_prec, annee_prec = 12, annee_actuelle - 1
    else:
        mois_prec, annee_prec = mois_actuel - 1, annee_actuelle

    transactions_prec = Transaction.objects.filter(
        utilisateur=user,
        date__month=mois_prec,
        date__year=annee_prec
    )
    revenus_prec = transactions_prec.filter(type_transaction='entree').aggregate(
        total=Sum('montant'))['total'] or Decimal('0')
    depenses_prec = transactions_prec.filter(type_transaction='sortie').aggregate(
        total=Sum('montant'))['total'] or Decimal('0')

    # Calcul des variations
    def variation(actuel, precedent):
        if precedent == 0:
            return 0
        return round(float((actuel - precedent) / precedent * 100), 1)

    # Solde global
    total_entrees = Transaction.objects.filter(utilisateur=user, type_transaction='entree').aggregate(
        total=Sum('montant'))['total'] or Decimal('0')
    total_sorties = Transaction.objects.filter(utilisateur=user, type_transaction='sortie').aggregate(
        total=Sum('montant'))['total'] or Decimal('0')
    solde = total_entrees - total_sorties

    # Dettes actives
    dettes = Dette.objects.filter(utilisateur=user).exclude(statut='regle')
    total_dettes = dettes.aggregate(total=Sum('montant'))['total'] or Decimal('0')
    nb_echeances = dettes.filter(
        echeance__lte=today + timedelta(days=7)
    ).count()

    # Graphique 6 derniers mois
    graphique = []
    for i in range(5, -1, -1):
        if today.month - i <= 0:
            m = today.month - i + 12
            a = today.year - 1
        else:
            m = today.month - i
            a = today.year
        t = Transaction.objects.filter(utilisateur=user, date__month=m, date__year=a)
        r = t.filter(type_transaction='entree').aggregate(total=Sum('montant'))['total'] or 0
        d = t.filter(type_transaction='sortie').aggregate(total=Sum('montant'))['total'] or 0
        graphique.append({
            'mois': f"{calendar.month_abbr[m]}",
            'revenus': float(r),
            'depenses': float(d),
        })

    # Répartition dépenses par catégorie (mois actuel)
    repartition = transactions_mois.filter(type_transaction='sortie').values(
        'categorie__nom', 'categorie__couleur'
    ).annotate(total=Sum('montant')).order_by('-total')[:5]

    # Dernières transactions
    dernieres = TransactionSerializer(
        Transaction.objects.filter(utilisateur=user).select_related('categorie')[:5],
        many=True
    ).data

    # Alertes budget
    alertes = []
    for alerte in AlerteBudget.objects.filter(utilisateur=user, active=True).select_related('categorie'):
        if alerte.categorie.budget_mensuel:
            depense_cat = transactions_mois.filter(
                type_transaction='sortie', categorie=alerte.categorie
            ).aggregate(total=Sum('montant'))['total'] or 0
            pourcentage = float(depense_cat) / float(alerte.categorie.budget_mensuel) * 100
            if pourcentage >= alerte.seuil_pourcentage:
                alertes.append({
                    'categorie': alerte.categorie.nom,
                    'pourcentage': round(pourcentage, 1),
                    'budget': float(alerte.categorie.budget_mensuel),
                    'depense': float(depense_cat),
                })

    # Recommandations IA simples
    recommandations = generer_recommandations(user, transactions_mois, dettes, today)

    return Response({
        'solde': float(solde),
        'revenus_mois': float(revenus_mois),
        'depenses_mois': float(depenses_mois),
        'variation_revenus': variation(revenus_mois, revenus_prec),
        'variation_depenses': variation(depenses_mois, depenses_prec),
        'total_dettes': float(total_dettes),
        'nb_echeances': nb_echeances,
        'graphique': graphique,
        'repartition_depenses': [
            {
                'categorie': r['categorie__nom'] or 'Sans catégorie',
                'couleur': r['categorie__couleur'] or '#6c757d',
                'total': float(r['total']),
            } for r in repartition
        ],
        'dernieres_transactions': dernieres,
        'alertes': alertes,
        'recommandations': recommandations,
    })


def generer_recommandations(user, transactions_mois, dettes, today):
    recommandations = []

    # Vérifier dépenses par catégorie avec budget
    categories = Categorie.objects.filter(utilisateur=user, budget_mensuel__isnull=False)
    for cat in categories:
        depense = transactions_mois.filter(
            type_transaction='sortie', categorie=cat
        ).aggregate(total=Sum('montant'))['total'] or 0
        if cat.budget_mensuel and depense > 0:
            pct = float(depense) / float(cat.budget_mensuel) * 100
            if pct > 90:
                recommandations.append(
                    f"⚠️ Budget {cat.nom} dépassé à {pct:.0f}% — réduire les dépenses dans cette catégorie"
                )
            elif pct > 75:
                recommandations.append(
                    f"📊 Budget {cat.nom} à {pct:.0f}% — surveiller les prochaines dépenses"
                )

    # Dettes en retard
    dettes_retard = dettes.filter(statut='en_retard')
    for dette in dettes_retard:
        jours = (today - dette.echeance).days
        recommandations.append(
            f"🔴 Dette envers {dette.creancier} en retard de {jours} jour(s) — régulariser rapidement"
        )

    # Dettes proches
    dettes_proches = dettes.filter(statut='proche')
    for dette in dettes_proches:
        jours = (dette.echeance - today).days
        recommandations.append(
            f"🟡 Échéance {dette.creancier} dans {jours} jour(s) — prévoir le paiement"
        )

    # Trésorerie positive
    total_entrees = Transaction.objects.filter(utilisateur=user, type_transaction='entree').aggregate(
        total=Sum('montant'))['total'] or 0
    total_sorties = Transaction.objects.filter(utilisateur=user, type_transaction='sortie').aggregate(
        total=Sum('montant'))['total'] or 0
    if float(total_entrees) > float(total_sorties):
        recommandations.append("✅ Trésorerie positive — anticiper les charges de fin de mois")

    if not recommandations:
        recommandations.append("✅ Situation financière saine — continuez sur cette lancée !")

    return recommandations[:5]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rapport_mensuel(request):
    user = request.user
    today = date.today()
    mois = int(request.query_params.get('mois', today.month))
    annee = int(request.query_params.get('annee', today.year))

    transactions = Transaction.objects.filter(
        utilisateur=user, date__month=mois, date__year=annee
    ).select_related('categorie')

    revenus = transactions.filter(type_transaction='entree').aggregate(
        total=Sum('montant'), nb=Count('id'))
    depenses = transactions.filter(type_transaction='sortie').aggregate(
        total=Sum('montant'), nb=Count('id'))

    total_revenus = revenus['total'] or Decimal('0')
    total_depenses = depenses['total'] or Decimal('0')
    resultat_net = total_revenus - total_depenses

    # Répartition par catégorie
    par_categorie = transactions.values(
        'categorie__nom', 'categorie__couleur', 'type_transaction'
    ).annotate(total=Sum('montant'), nb=Count('id')).order_by('-total')

    # Mois précédent pour comparaison
    mois_prec = mois - 1 if mois > 1 else 12
    annee_prec = annee if mois > 1 else annee - 1
    trans_prec = Transaction.objects.filter(utilisateur=user, date__month=mois_prec, date__year=annee_prec)
    rev_prec = trans_prec.filter(type_transaction='entree').aggregate(total=Sum('montant'))['total'] or Decimal('0')
    dep_prec = trans_prec.filter(type_transaction='sortie').aggregate(total=Sum('montant'))['total'] or Decimal('0')

    def variation(actuel, precedent):
        if not precedent or precedent == 0:
            return 0
        return round(float((actuel - precedent) / precedent * 100), 1)

    return Response({
        'mois': mois,
        'annee': annee,
        'total_revenus': float(total_revenus),
        'total_depenses': float(total_depenses),
        'resultat_net': float(resultat_net),
        'nb_transactions': (revenus['nb'] or 0) + (depenses['nb'] or 0),
        'nb_entrees': revenus['nb'] or 0,
        'nb_sorties': depenses['nb'] or 0,
        'variation_revenus': variation(total_revenus, rev_prec),
        'variation_depenses': variation(total_depenses, dep_prec),
        'par_categorie': [
            {
                'categorie': r['categorie__nom'] or 'Sans catégorie',
                'couleur': r['categorie__couleur'] or '#6c757d',
                'type': r['type_transaction'],
                'total': float(r['total']),
                'nb': r['nb'],
            } for r in par_categorie
        ],
        'recommandations': generer_recommandations(
            user,
            transactions,
            Dette.objects.filter(utilisateur=user).exclude(statut='regle'),
            today
        ),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def envoyer_code_verification(request):
    """Envoyer un code de vérification par email"""
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response(
            {'error': 'Email requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier que l'email n'existe pas déjà
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Cet email est déjà utilisé'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Supprimer les anciens codes non expirés pour cet email
    CodeVerification.objects.filter(email=email, verified=False).delete()
    
    # Générer un nouveau code
    code = CodeVerification.generer_code()
    verification = CodeVerification.objects.create(email=email, code=code)
    
    # Envoyer l'email
    print("SENDGRID KEY:", settings.EMAIL_HOST_PASSWORD)
    try:
        send_mail(
            'Code de vérification GestFin',
            f'Votre code de vérification est: {code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    except Exception as e:
        print("ERREUR EMAIL:", str(e))
        return Response(
            {"error": f"Email error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # ✅ Si on arrive ici = email envoyé
    response_data = {
        'message': 'Code généré',
        'verification_id': verification.id,
    }
    
    if settings.DEBUG:
        response_data['code'] = code
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verifier_code(request):
    """Vérifier le code envoyé par email"""
    email = request.data.get('email', '').strip().lower()
    code = request.data.get('code', '')
    
    if not email or not code:
        return Response(
            {'error': 'Email et code requis'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        verification = CodeVerification.objects.get(email=email, code=code)
    except CodeVerification.DoesNotExist:
        return Response(
            {'error': 'Code invalide ou email incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Vérifier le code
    is_valid, message = verification.is_valid(code)
    if not is_valid:
        return Response(
            {'error': message},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'message': 'Code vérifié avec succès',
        'verification_id': verification.id,
    }, status=status.HTTP_200_OK)
