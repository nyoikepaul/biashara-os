#!/bin/bash

# Database Credentials
DB_NAME="biashara_db"
DB_USER="postgres"
DB_HOST="localhost"

# Pre-hashed bcrypt for 'password123'
HASHED_PW='$2b$10$nO.pXmE/LzN2Lp6A6G9OLeRkS/G.R8K/X.B6C8uH8.W8.Z8.Z8.Z8.'
USER_ID=$(uuidgen)

echo "🌱 Seeding BiasharaOS with an OWNER user..."

psql -U $DB_USER -d $DB_NAME -h $DB_HOST -c "
INSERT INTO \"User\" (id, email, password, role, name) 
VALUES ('$USER_ID', 'paul@biashara.os', '$HASHED_PW', 'OWNER', 'Paul Nyoike')
ON CONFLICT (email) DO NOTHING;"

echo "✅ Done! You can now login with: paul@biashara.os / password123"
