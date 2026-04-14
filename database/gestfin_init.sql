-- =============================================
-- GestFin — Script SQL de création de la base
-- MySQL 8.0+
-- =============================================

CREATE DATABASE IF NOT EXISTS gestfin_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestfin_db;

-- L'ORM Django crée toutes les tables via les migrations.
-- Ce script crée uniquement la base de données.
-- Après "python manage.py migrate", les tables suivantes
-- seront créées automatiquement :

-- gestfin_app_utilisateur   (utilisateurs)
-- gestfin_app_categorie     (catégories de transactions)
-- gestfin_app_transaction   (entrées et sorties)
-- gestfin_app_dette         (dettes et factures)
-- gestfin_app_alertebudget  (alertes de budget)

-- Créer un utilisateur MySQL dédié (optionnel mais recommandé)
-- Remplacer 'votre_mot_de_passe' par un mot de passe fort

CREATE USER IF NOT EXISTS 'gestfin_user'@'localhost' IDENTIFIED BY '1111';
GRANT ALL PRIVILEGES ON gestfin_db.* TO 'gestfin_user'@'localhost';
FLUSH PRIVILEGES;

-- Vérification
SELECT 'Base de données gestfin_db créée avec succès !' AS message;
