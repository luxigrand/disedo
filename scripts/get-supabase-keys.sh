#!/bin/bash

# Supabase ANON_KEY'i almak için helper script
# Kullanım: ./scripts/get-supabase-keys.sh

PROJECT_REF="srqrauqximqbdfknjczz"
SUPABASE_URL="https://srqrauqximqbdfknjczz.supabase.co"

echo "Supabase bilgileri:"
echo "==================="
echo "Project URL: $SUPABASE_URL"
echo ""
echo "ANON_KEY'i almak için:"
echo "1. https://supabase.com/dashboard/project/$PROJECT_REF/settings/api adresine gidin"
echo "2. 'Project API keys' bölümünden 'anon' 'public' key'i kopyalayın"
echo "3. .env.local dosyasındaki 'your-anon-key-here' değerini değiştirin"
echo ""
echo "Veya doğrudan tarayıcıda şu adresi açın:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
