#!/bin/bash

# Supabase Environment Setup Script
# Kullanım: ./scripts/setup-env.sh YOUR_ANON_KEY

PROJECT_REF="srqrauqximqbdfknjczz"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ENV_FILE=".env.local"

echo "🔧 Supabase Environment Setup"
echo "============================"
echo ""

if [ -z "$1" ]; then
  echo "❌ Hata: ANON_KEY gerekli!"
  echo ""
  echo "Kullanım:"
  echo "  ./scripts/setup-env.sh YOUR_ANON_KEY"
  echo ""
  echo "ANON_KEY'i almak için:"
  echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api"
  echo ""
  exit 1
fi

ANON_KEY="$1"

# Create or update .env.local
cat > "$ENV_FILE" << EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
EOF

echo "✅ .env.local dosyası güncellendi!"
echo ""
echo "Mevcut değerler:"
echo "  URL: ${SUPABASE_URL}"
echo "  ANON_KEY: ${ANON_KEY:0:20}... (ilk 20 karakter)"
echo ""
echo "🚀 Development server'ı yeniden başlatın:"
echo "  npm run dev"
echo ""
