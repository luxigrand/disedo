# Supabase Kurulumu

## Environment Variables

✅ `.env.local` dosyası oluşturuldu ve URL dolduruldu!

Şimdi sadece ANON_KEY'i eklemeniz gerekiyor:

1. **Supabase Dashboard'a gidin:**
   https://supabase.com/dashboard/project/srqrauqximqbdfknjczz/settings/api

2. **ANON_KEY'i kopyalayın:**
   - "Project API keys" bölümünde
   - `anon` `public` key'i bulun
   - Key'i kopyalayın

3. **`.env.local` dosyasını düzenleyin:**
   ```bash
   nano .env.local
   # veya
   code .env.local
   ```
   
4. **`your-anon-key-here` değerini kopyaladığınız key ile değiştirin**

Alternatif olarak terminal'de:
```bash
# ANON_KEY'inizi buraya yapıştırın
sed -i 's/your-anon-key-here/YOUR_ACTUAL_ANON_KEY_HERE/' .env.local
```

## Veritabanı Kurulumu

1. Supabase Dashboard'da SQL Editor'ı açın
2. `supabase/schema.sql` dosyasındaki tüm SQL kodunu çalıştırın
3. Realtime'i etkinleştirin:
   - Database > Replication bölümüne gidin
   - `messages` tablosunun yanındaki toggle'ı açın

## Notlar

- `.env.local` dosyası git'e commit edilmemelidir (zaten .gitignore'da olmalı)
- Environment variable'lar değiştikten sonra development server'ı yeniden başlatın
